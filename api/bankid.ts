import axios, { AxiosError } from "axios";
import https from "https";
import to from "await-to-js";
import { config } from "./config";
import { NextRequest, NextResponse } from "next/server";
import { headers } from 'next/headers'
import crypto from 'crypto'

let secretKeyStore = new Map()

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        pfx: config.pfx,
        passphrase: config.passphrase,
        ca: config.ca,
        rejectUnauthorized: false, // Note: Setting this to false can introduce security risks
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
        axiosInstance.post(`${config.bankdIdUrl}/${method}`, params)
    );

    if (error) {
        if (isAxiosError(error)) {
            if (error.response && error.response.data) {
                // Handle errors
                console.error(error.response.data);
            }
            return { error };
        }
    }

    return result?.data;
}

async function generateQrData(rpResponse: any, orderTime: any) {
    const qrStartToken = rpResponse.qrStartToken;
    const qrStartSecret = rpResponse.qrStartSecret;

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

    if (params) {
        try {
            params = JSON.parse(params)
        } catch (e) {
            console.error(e);
            return NextResponse.json({ error: "Invalid JSON" });
        }
    }

    let result

    switch (method) {
        case "refresh-qr":
            const startToken = params?.qrStartToken
            const startDate = new Date(params?.startDate)

            const response = {
                qrStartToken: startToken,
                qrStartSecret: secretKeyStore.get(startToken)
            }

            result = await generateQrData(response, startDate);
            break;

        case "auth":
            const ip = headers().get('x-forwarded-for')

            const data = await call("auth", {
                ip,
            })

            result = {
                orderRef: data.orderRef,
                qrStartToken: data.qrStartToken,
                autoStartToken: data.autoStartToken,
            }

            secretKeyStore.set(result.qrStartToken, data.qrStartSecret)
            break;

        case "collect":
            const orderRef = params?.orderRef

            if (!orderRef) {
                return NextResponse.json({ error: "No orderRef specified" });
            }

            result = await call('collect', { orderRef })
            break;
        default:
            return NextResponse.json({ error: "Unknown method" });
    }

    return NextResponse.json(result);
}