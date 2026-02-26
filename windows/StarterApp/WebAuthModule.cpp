#include "pch.h"
#include "WebAuthModule.h"

#include <bcrypt.h>
#include <wincrypt.h>
#include <shellapi.h>
#include <winsock2.h>
#include <ws2tcpip.h>

#include <string>
#include <vector>
#include <thread>
#include <regex>

#pragma comment(lib, "bcrypt.lib")
#pragma comment(lib, "crypt32.lib")
#pragma comment(lib, "ws2_32.lib")

namespace StarterApp {

void WebAuthModule::Initialize(
    winrt::Microsoft::ReactNative::ReactContext const &reactContext) noexcept {
  m_reactContext = reactContext;
}

std::string WebAuthModule::Base64UrlEncode(const std::vector<uint8_t> &data) {
  DWORD base64Len = 0;
  CryptBinaryToStringA(data.data(), static_cast<DWORD>(data.size()),
                       CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF, nullptr,
                       &base64Len);

  std::string base64(base64Len, '\0');
  CryptBinaryToStringA(data.data(), static_cast<DWORD>(data.size()),
                       CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF,
                       base64.data(), &base64Len);
  base64.resize(base64Len);

  // Convert base64 to base64url
  std::string result;
  result.reserve(base64.size());
  for (char c : base64) {
    if (c == '+')
      result += '-';
    else if (c == '/')
      result += '_';
    else if (c == '=')
      continue; // strip padding
    else
      result += c;
  }
  return result;
}

void WebAuthModule::generateCodeVerifier(
    React::ReactPromise<std::string> result) noexcept {
  std::vector<uint8_t> randomBytes(32);
  NTSTATUS status =
      BCryptGenRandom(nullptr, randomBytes.data(),
                      static_cast<ULONG>(randomBytes.size()),
                      BCRYPT_USE_SYSTEM_PREFERRED_RNG);
  if (!BCRYPT_SUCCESS(status)) {
    result.Reject(React::ReactError{
        "RANDOM_ERROR", "Failed to generate random bytes"});
    return;
  }

  result.Resolve(Base64UrlEncode(randomBytes));
}

void WebAuthModule::sha256(std::string input,
                           React::ReactPromise<std::string> result) noexcept {
  BCRYPT_ALG_HANDLE hAlg = nullptr;
  BCRYPT_HASH_HANDLE hHash = nullptr;
  NTSTATUS status;

  status = BCryptOpenAlgorithmProvider(&hAlg, BCRYPT_SHA256_ALGORITHM, nullptr,
                                       0);
  if (!BCRYPT_SUCCESS(status)) {
    result.Reject(
        React::ReactError{"HASH_ERROR", "Failed to open algorithm provider"});
    return;
  }

  status = BCryptCreateHash(hAlg, &hHash, nullptr, 0, nullptr, 0, 0);
  if (!BCRYPT_SUCCESS(status)) {
    BCryptCloseAlgorithmProvider(hAlg, 0);
    result.Reject(
        React::ReactError{"HASH_ERROR", "Failed to create hash"});
    return;
  }

  status = BCryptHashData(hHash,
                          reinterpret_cast<PUCHAR>(
                              const_cast<char *>(input.data())),
                          static_cast<ULONG>(input.size()), 0);
  if (!BCRYPT_SUCCESS(status)) {
    BCryptDestroyHash(hHash);
    BCryptCloseAlgorithmProvider(hAlg, 0);
    result.Reject(
        React::ReactError{"HASH_ERROR", "Failed to hash data"});
    return;
  }

  std::vector<uint8_t> hashValue(32); // SHA-256 = 32 bytes
  status = BCryptFinishHash(hHash, hashValue.data(),
                            static_cast<ULONG>(hashValue.size()), 0);
  BCryptDestroyHash(hHash);
  BCryptCloseAlgorithmProvider(hAlg, 0);

  if (!BCRYPT_SUCCESS(status)) {
    result.Reject(
        React::ReactError{"HASH_ERROR", "Failed to finish hash"});
    return;
  }

  result.Resolve(Base64UrlEncode(hashValue));
}

void WebAuthModule::authenticate(
    std::string url, std::string callbackScheme,
    React::ReactPromise<React::JSValue> result) noexcept {
  std::thread([url = std::move(url), callbackScheme = std::move(callbackScheme),
               result = std::move(result)]() mutable {
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
      result.Reject(
          React::ReactError{"SOCKET_ERROR", "Failed to initialize Winsock"});
      return;
    }

    SOCKET listenSock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listenSock == INVALID_SOCKET) {
      WSACleanup();
      result.Reject(
          React::ReactError{"SOCKET_ERROR", "Failed to create socket"});
      return;
    }

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port = 0;

    if (bind(listenSock, reinterpret_cast<sockaddr *>(&addr), sizeof(addr)) ==
        SOCKET_ERROR) {
      closesocket(listenSock);
      WSACleanup();
      result.Reject(
          React::ReactError{"SOCKET_ERROR", "Failed to bind socket"});
      return;
    }

    int addrLen = sizeof(addr);
    getsockname(listenSock, reinterpret_cast<sockaddr *>(&addr), &addrLen);
    int port = ntohs(addr.sin_port);

    if (listen(listenSock, 1) == SOCKET_ERROR) {
      closesocket(listenSock);
      WSACleanup();
      result.Reject(
          React::ReactError{"SOCKET_ERROR", "Failed to listen on socket"});
      return;
    }

    std::string redirectUri =
        "http://127.0.0.1:" + std::to_string(port) + "/callback";

    std::string fullUrl = url;
    if (fullUrl.find('?') != std::string::npos)
      fullUrl += "&redirect_uri=" + redirectUri;
    else
      fullUrl += "?redirect_uri=" + redirectUri;

    std::wstring wUrl(fullUrl.begin(), fullUrl.end());
    ShellExecuteW(nullptr, L"open", wUrl.c_str(), nullptr, nullptr,
                  SW_SHOWNORMAL);

    DWORD timeout = 60000;
    setsockopt(listenSock, SOL_SOCKET, SO_RCVTIMEO,
               reinterpret_cast<const char *>(&timeout), sizeof(timeout));

    SOCKET clientSock = accept(listenSock, nullptr, nullptr);
    if (clientSock == INVALID_SOCKET) {
      closesocket(listenSock);
      WSACleanup();
      result.Resolve(React::JSValue{nullptr});
      return;
    }

    char buf[4096];
    int bytesRead = recv(clientSock, buf, sizeof(buf) - 1, 0);
    if (bytesRead <= 0) {
      closesocket(clientSock);
      closesocket(listenSock);
      WSACleanup();
      result.Resolve(React::JSValue{nullptr});
      return;
    }
    buf[bytesRead] = '\0';

    const char *response =
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: text/html\r\n"
        "Connection: close\r\n\r\n"
        "<html><body><p>Authentication complete. You may close this "
        "tab.</p><script>window.close()</script></body></html>";
    send(clientSock, response, static_cast<int>(strlen(response)), 0);
    closesocket(clientSock);
    closesocket(listenSock);
    WSACleanup();

    std::string request(buf);
    std::regex requestLineRegex(R"(GET\s+(/\S+)\s+HTTP)");
    std::smatch match;
    if (std::regex_search(request, match, requestLineRegex)) {
      std::string path = match[1].str();
      auto qPos = path.find('?');
      if (qPos == std::string::npos) {
        result.Resolve(React::JSValue{nullptr});
        return;
      }
      std::string callbackUrl =
          callbackScheme + "://callback" + path.substr(qPos);
      result.Resolve(React::JSValue{callbackUrl});
    } else {
      result.Resolve(React::JSValue{nullptr});
    }
  }).detach();
}

} // namespace StarterApp
