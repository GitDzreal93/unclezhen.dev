import { createHash } from "node:crypto";

// z-pay (易支付 / epay standard) page-jump payment helper.
//
// Signing rule: take all params except `sign`, `sign_type` and empty values,
// sort by key ascending (ASCII), join as a=b&c=d WITHOUT url-encoding, append
// the merchant key directly, then md5 and lowercase.

export type ZpayParams = Record<string, string>;

function config() {
  const url = process.env.ZPAY_URL;
  const pid = process.env.ZPAY_PID;
  const key = process.env.ZPAY_KEY;
  if (!url || !pid || !key) {
    throw new Error("z-pay 未配置：请设置 ZPAY_URL / ZPAY_PID / ZPAY_KEY");
  }
  return { url: url.replace(/\/$/, ""), pid, key };
}

// Build the signing base string from params (excludes sign/sign_type/empty).
function signBase(params: ZpayParams): string {
  return Object.keys(params)
    .filter((k) => k !== "sign" && k !== "sign_type" && params[k] !== "" && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
}

export function sign(params: ZpayParams, key: string): string {
  return createHash("md5").update(signBase(params) + key, "utf8").digest("hex");
}

// Verify an incoming notify/return signature against our key.
export function verifySign(params: ZpayParams): boolean {
  const { key } = config();
  const given = params.sign;
  if (!given) return false;
  const expected = sign(params, key);
  return given.toLowerCase() === expected.toLowerCase();
}

export type BuildPaymentInput = {
  outTradeNo: string;
  name: string;
  money: string; // yuan, 2 decimals
  type: string; // alipay | wxpay
  notifyUrl: string;
  returnUrl: string;
};

// Produce the fully-signed field set to POST to z-pay's submit.php.
export function buildPaymentForm(input: BuildPaymentInput): {
  action: string;
  fields: ZpayParams;
} {
  const { url, pid, key } = config();
  const fields: ZpayParams = {
    pid,
    type: input.type,
    out_trade_no: input.outTradeNo,
    notify_url: input.notifyUrl,
    return_url: input.returnUrl,
    name: input.name,
    money: input.money,
    sign_type: "MD5",
  };
  fields.sign = sign(fields, key);
  return { action: `${url}/submit.php`, fields };
}
