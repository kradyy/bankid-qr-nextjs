import to from "await-to-js";
import { NextRequest, NextResponse } from "next/server";
import { headers } from 'next/headers'
import crypto from 'crypto'
import sha1 from 'crypto-js/sha1';
import https from 'https';
import axios, { AxiosError } from "axios";
import utf8 from 'utf8';
import { config } from "./config";

let secretKeyStore = new Map()

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        pfx: config.pfx,
        passphrase: config.passphrase,
        ca: config.ca,
    }),
    headers: {
        "Content-Type": "application/json",
    },
});

function isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError === true;
}

async function call(method: string, params: object) {
    const [error, result] = await to(
        axiosInstance.post(`${config.bankIdUrl}/${method}`, params)
    );

    if (error) {
        if (isAxiosError(error)) {
            if (error.response && error.response.data) {
                // Handle errors
                //console.error(error.response.data);
                console.error('Error in axios call')
            }
            return { error };
        }
    }

    return result?.data;
}

async function generateQrData(rpResponse: any, orderTime: any) {
    const qrStartToken = rpResponse.qrStartToken;
    const qrStartSecret = rpResponse.qrStartSecret;

    if (!qrStartToken || !qrStartSecret) {
        throw new Error("Missing qrStartToken or qrStartSecret");
    }

    const qrTime = Math.floor((new Date() as any - orderTime) / 1000).toString();

    const hmac = crypto.createHmac('sha256', qrStartSecret);
    hmac.update(qrTime);

    const qrAuthCode = hmac.digest('hex');

    const qrData = `bankid.${qrStartToken}.${qrTime}.${qrAuthCode}`;

    return qrData;
}

export async function GET(request: NextRequest) {
    const method = request.nextUrl.searchParams.get("method");
    let params = request.nextUrl.searchParams.get("params") as any

    const apiKey = request.headers.get('x-api-key');

    // Validate API key
    if (apiKey !== process.env.NEXT_PUBLIC_BANKID_VERIFICATION_API_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (params) {
        try {
            params = JSON.parse(params)
        } catch (e) {
            console.error(e);
            return NextResponse.json({ error: "Invalid JSON" });
        }
    }

    let result: any

    switch (method) {
        case "refresh-qr":
            try {
                const startToken = params?.qrStartToken
                const startDate = new Date(params?.startDate)

                const response = {
                    qrStartToken: startToken,
                    qrStartSecret: secretKeyStore.get(startToken)
                }

                result = await generateQrData(response, startDate);
            } catch (e) {
                console.error(e);
                return NextResponse.json({ error: "Failed to refresh QR" });
            }
            break;

        case "sign":
            const userVisibleData = request.nextUrl.searchParams.get("userVisibleData") || "" as string;

            const endUserIp = (await headers()).get('x-forwarded-for');

            result = await call("sign", {
                endUserIp: endUserIp,
                userVisibleData: btoa(utf8.encode(userVisibleData)),
                userVisibleDataFormat: "simpleMarkdownV1"
            });

            if (!result) {
                return NextResponse.json({ error: "Failed to call BankID" });
            }

            result.qrData = await generateQrData(result, new Date());

            secretKeyStore.set(result.qrStartToken, result.qrStartSecret)
            break

        case "auth":
            const ip = (await headers()).get('x-forwarded-for')

            let auth = {
                endUserIp: ip,
            } as any

            const data = await call("auth", auth) as any

            if (!data) {
                return NextResponse.json({ error: "Failed to call BankID" });
            }

            result = {
                orderRef: data.orderRef,
                qrStartToken: data.qrStartToken,
                autoStartToken: data.autoStartToken,
            }

            secretKeyStore.set(result.qrStartToken, data.qrStartSecret)
            break;

        case "collect":
            const orderRef = params?.orderRef
            const skipSetBankIdServerSecret = params?.skipSetBankIdServerSecret || false

            if (!orderRef) {
                return NextResponse.json({ error: "No orderRef specified" });
            }

            result = await call('collect', { orderRef })

            // Handle the succesfull result
            if (result?.status === 'complete') {
                const personalNumber = Number(result?.completionData?.user?.personalNumber)
                const secret = sha1(`${orderRef}-${Date.now()}`).toString();

                if (!personalNumber) {
                    return NextResponse.json({ error: "Invalid personal number" });
                }

                // Remove the previous secret key from the store
                secretKeyStore = new Map()

                // Add a bankID challenge secret to external api
                if (!skipSetBankIdServerSecret) {
                    // Set the secret in the external api
                }

                // Pass on secret to result
                result.secret = secret
            }
            break;
        default:
            return NextResponse.json({ error: "Unknown method" });
    }

    return NextResponse.json(result);
}

