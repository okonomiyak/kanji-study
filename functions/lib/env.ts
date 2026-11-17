export interface Env {
  AUTH_USER?: string;
  AUTH_PASSWORD?: string;
  AUTH_SECRET?: string;
}

/** 必要な環境変数がそろっているか。足りなければ誰も入れない（安全側に倒す）。 */
export function authConfigured(env: Env): env is Required<Env> {
  return Boolean(env.AUTH_USER && env.AUTH_PASSWORD && env.AUTH_SECRET);
}
