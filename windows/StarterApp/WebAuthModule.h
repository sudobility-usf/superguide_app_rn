#pragma once

#include "pch.h"
#include "NativeModules.h"
#include <winrt/Microsoft.ReactNative.h>

namespace StarterApp {

REACT_MODULE(WebAuthModule)
struct WebAuthModule {
  REACT_INIT(Initialize)
  void Initialize(winrt::Microsoft::ReactNative::ReactContext const &reactContext) noexcept;

  REACT_METHOD(generateCodeVerifier)
  void generateCodeVerifier(React::ReactPromise<std::string> result) noexcept;

  REACT_METHOD(sha256)
  void sha256(std::string input, React::ReactPromise<std::string> result) noexcept;

  REACT_METHOD(authenticate)
  void authenticate(std::string url, std::string callbackScheme,
                    React::ReactPromise<React::JSValue> result) noexcept;

 private:
  static std::string Base64UrlEncode(const std::vector<uint8_t> &data);
  winrt::Microsoft::ReactNative::ReactContext m_reactContext;
};

} // namespace StarterApp
