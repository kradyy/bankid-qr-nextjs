"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Set axios base URL
axios.defaults.baseURL = process.env.NEXT_PUBLIC_SITE_URL

const refreshInterval = 2000; // Refresh every 2000 milliseconds (2 seconds)
const signUpTimeout = 30000; // Timeout after 30000 milliseconds (30 seconds)

const QR_CODE = {
    fetchAndUpdateQRCode: async (
        qrStartToken: any,
        setQRDataString: any,
        startDate: any
    ) => {
        try {
            const params = {
                method: "refresh-qr",
                params: JSON.stringify({
                    qrStartToken,
                    startDate: startDate.toString(),
                }),
            };

            console.log(params);

            const response = await axios.get(
                "/api/bankid",
                { params }
            );

            const data = await response.data;

            setQRDataString(data);
        } catch (error: any) {
            console.error("Error fetching QR code data:", error.message);
        }
    },
    startQRCodeRefresh: (qrStartToken: any, setQRDataString: any, completed: any, hasTimedOut: any) => {
        let startDate = new Date();

        const intervalId = setInterval(() => {
            QR_CODE.fetchAndUpdateQRCode(qrStartToken, setQRDataString, startDate);
        }, refreshInterval);

        console.log(completed);

        if (completed || hasTimedOut) {
            clearInterval(intervalId);
        }

        console.log('logs');

        return () => clearInterval(intervalId);
    },
};

const useBankIdQrCode = () => {
    const [triggerCounter, setTriggerCounter] = useState(0);
    const [auth, setAuthData] = useState<any>(null);
    const [hasTimedOut, setHasTimedOut] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [qrCodeImage, setQRCodeImage] = useState<string>("");
    const [qrDataString, setQRDataString] = useState();
    const [identification, setIndentification] = useState<any>(null);

    const retriggerAuth = () => {
        setTriggerCounter(prevCount => prevCount + 1);
    };

    // Init the auth process
    useEffect(() => {
        if (triggerCounter === 0) {
            return;
        }

        setHasTimedOut(false)

        const signInTimeout = setTimeout(() => {
            setHasTimedOut(true);
        }, 30000);

        (async () => {
            const params = {
                method: "auth",
            };

            try {
                const response = await axios.get(
                    "/api/bankid",
                    { params }
                );
                const data = await response.data;
                setAuthData(data);


            } catch (error: any) {
                console.error("Error fetching:", error.message);
            }
        })();

        return () => clearTimeout(signInTimeout);
    }, [triggerCounter]);

    // Init the collection process
    useEffect(() => {
        if (triggerCounter === 0) {
            return;
        }

        const collectToken = () => {
            (async () => {
                const params = {
                    params: JSON.stringify({ orderRef: auth?.orderRef }),
                    method: "collect",
                };

                try {
                    const response = await axios.get(
                        "/api/bankid",
                        {
                            params: params,
                        }
                    );
                    const data = await response.data;

                    if (data?.status === "complete") {
                        setIndentification(data);
                        setCompleted(true);
                        clearInterval(i);
                    }

                    if (hasTimedOut === true || data?.status === 'failed') {
                        clearInterval(i);
                    }

                    console.log('logs');
                } catch (error: any) {
                    console.error("Error fetching:", error.message);
                    throw error;
                }
            })();
        }

        const i = setInterval(collectToken, 2000);

        return () => clearInterval(i);
    }, [auth]);

    // Start the QR code refresh process
    useEffect(() => {
        if (triggerCounter === 0) {
            return;
        }

        if (!auth?.qrStartToken) {
            return;
        }

        const cleanup = QR_CODE.startQRCodeRefresh(auth?.qrStartToken, setQRDataString, completed, hasTimedOut);

        return cleanup; // Ensures the interval is cleared when the component unmounts
    }, [auth, completed, hasTimedOut]);

    if (qrDataString) {
        QRCode.toDataURL(qrDataString)
            .then((url: string) => {
                setQRCodeImage(url);
            })
            .catch((err: any) => {
                setQRCodeImage("");
            });
    }

    return {
        qrCodeImage: qrCodeImage,
        hasTimedOut: hasTimedOut,
        identification: identification,
        retriggerAuth: retriggerAuth,
    };
};

export default useBankIdQrCode;
