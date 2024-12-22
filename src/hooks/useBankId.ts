"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";

const REFRESH_INTERVAL = 2000; // Refresh every 2000 milliseconds (2 seconds)
const SIGNUP_TIMEOUT = 30000; // Timeout after 30000 milliseconds (30 seconds)

const QR_CODE = {
    fetchAndUpdateQRCode: async (
        qrStartToken: string,
        orderRef: any,
        setHasError: any,
        setQRDataString: (data: string) => void,
        startDate: Date
    ) => {
        try {
            if (!qrStartToken || !startDate) {
                return;
            }

            const params = new URLSearchParams({
                method: "refresh-qr",
                params: JSON.stringify({
                    qrStartToken,
                    orderRef,
                    startDate: startDate.toString(),
                }),
            });

            const queryString = new URLSearchParams(params).toString();

            const response = await fetch(`/api/bankId?${queryString}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'x-api-key': process.env.NEXT_PUBLIC_BANKID_VERIFICATION_API_KEY || "",
                    Accept: "application/json",
                },
            });

            const data = await response.json();

            setQRDataString(data);
        } catch (error: any) {
            //console.error("Error fetching QR code data:", error);
            setHasError(true);
        }
    },
    startQRCodeRefresh: (
        qrStartToken: string,
        orderRef: string,
        setQRDataString: (data: string) => void,
        setHasError: any,
        completed: boolean,
        hasTimedOut: boolean,
        hasError: boolean
    ) => {
        let startDate = new Date();

        const intervalId = setInterval(() => {
            if (completed || hasTimedOut || hasError) {
                clearInterval(intervalId);
                return;
            }

            QR_CODE.fetchAndUpdateQRCode(qrStartToken, orderRef, setHasError, setQRDataString, startDate);
        }, REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    },
};

interface BankIdOptions {
    userVisibleData?: string,
    bankIdMethod?: "sign" | "auth",
    skipSetBankIdServerSecret?: boolean,
}

const useBankId = (options?: BankIdOptions) => {
    const [triggerCounter, setTriggerCounter] = useState(0);
    const [auth, setAuthData] = useState<any>(null);
    const [hasTimedOut, setHasTimedOut] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [qrCodeImage, setQRCodeImage] = useState<string>("");
    const [qrDataString, setQRDataString] = useState<string>("");
    const [identification, setIdentification] = useState<any>(null);
    const [autoSignIn, setAutoSignIn] = useState(false);
    const [hintCode, setHintCode] = useState<string>("");

    const reset = useCallback(() => {
        setQRCodeImage("");
        setAuthData(null);
        setIdentification(null);
        setCompleted(false);
        setHasTimedOut(false);
        setHasError(false);
        setAutoSignIn(false);
    }, []);

    const retriggerAuth = useCallback(() => {
        reset();
        setTriggerCounter(prevCount => prevCount + 1);
    }, [reset]);

    // Init the auth/sign process
    useEffect(() => {
        if (auth || triggerCounter === 0) return;
        //if (triggerCounter === 0) return;

        setHasTimedOut(false);

        const signInTimeout = setTimeout(() => {
            setHasTimedOut(true);
        }, SIGNUP_TIMEOUT);

        const fetchData = async () => {
            let params: { method: any; userVisibleData?: any } = { method: options?.bankIdMethod || "auth" };

            if (options?.userVisibleData) {
                params.userVisibleData = options.userVisibleData;
            }

            const queryString = new URLSearchParams(params).toString();

            const MAX_RETRIES = 5; // Maximum number of retries
            const RETRY_DELAY = 1000; // Delay between retries in milliseconds

            const retryFetch = async (attempt: number = 1): Promise<any> => {
                try {
                    const response = await fetch(`/api/bankId?${queryString}`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            'x-api-key': process.env.NEXT_PUBLIC_BANKID_VERIFICATION_API_KEY || "",
                            Accept: "application/json",
                        },
                    });

                    const data = await response.json();


                    if (!data) {
                        throw new Error("No data returned from the API");
                    }

                    setAuthData(data);
                    return data;
                } catch (error: any) {
                    console.error(`Attempt ${attempt} failed:`, error);

                    if (attempt < MAX_RETRIES) {
                        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
                        return retryFetch(attempt + 1);
                    } else {
                        //console.error("Max retries reached. Failed to fetch data.");
                        setHasError(true);
                        throw error;
                    }
                }
            };

            try {
                await retryFetch();
            } catch (error) {
                console.error("Failed to set auth data after retries:", error);
            }
        };

        fetchData();

        return () => clearTimeout(signInTimeout);
    }, [triggerCounter]);

    // Init the collection process
    useEffect(() => {
        if (triggerCounter === 0 || !auth?.orderRef) return;

        const collectToken = async () => {
            if (completed) {
                clearInterval(intervalId);
                return;
            }

            const params = {
                params: JSON.stringify({ orderRef: auth.orderRef, skipSetBankIdServerSecret: options?.skipSetBankIdServerSecret }),
                method: "collect",
            };

            const queryString = new URLSearchParams(params).toString();

            try {
                const response = await fetch(`/api/bankId?${queryString}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        'x-api-key': process.env.NEXT_PUBLIC_BANKID_VERIFICATION_API_KEY || "",
                        Accept: "application/json",
                    },
                });

                const data = await response.json();

                if (data?.status === "complete") {
                    setIdentification(data);
                    setCompleted(true);
                } else if (data?.status === 'failed' || hasTimedOut || hasError) {
                    clearInterval(intervalId);
                    setHasError(true);
                    setHintCode(data.hintCode);
                }
            } catch (error: any) {
                //console.log("Error fetching:", error);
                setHasError(true);
                clearInterval(intervalId);
            }
        };

        const intervalId = setInterval(collectToken, REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [auth, hasTimedOut, completed, hasError, triggerCounter]);

    // Start the QR code refresh process
    useEffect(() => {
        if (triggerCounter === 0 || !auth?.qrStartToken || !auth.orderRef || autoSignIn) return;

        return QR_CODE.startQRCodeRefresh(auth.qrStartToken, auth.orderRef, setQRDataString, setHasError, completed, hasTimedOut, hasError);
    }, [auth, completed, hasTimedOut, hasError, triggerCounter]);

    // Generate QR code image
    useEffect(() => {
        if (!qrDataString || hasTimedOut || hasError || autoSignIn) return;

        QRCode.toDataURL(qrDataString)
            .then((url: string) => {
                setQRCodeImage(url);
            })
            .catch((error: any) => {
                setQRCodeImage("");
                //setHasError(true);
                //console.error("Error generating QR code image:", err);
            });
    }, [qrDataString]);

    return {
        qrCodeImage,
        hasTimedOut,
        identification,
        hasError,
        hintCode,
        retriggerAuth,
        triggerAutoSignIn: () => setAutoSignIn(true),
        autoStartToken: auth?.autoStartToken,
        startToken: auth?.qrStartToken,
        reset,
    };
};

export default useBankId;
