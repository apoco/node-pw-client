#ifndef PROMISE_WORKER_HPP
#define PROMISE_WORKER_HPP

#include <napi.h>

Napi::Promise async(Napi::Env env, std::function<void()> fn);
Napi::Promise async(Napi::Env env, std::function<void()> fn, std::function<Napi::Value()> resolveAs);

Napi::Promise resolved(Napi::Value value);
Napi::Promise rejected(Napi::Error err);

#endif // PROMISE_WORKER_HPP
