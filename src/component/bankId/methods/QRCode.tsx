import Alert from "@/components/elements/Alert";
import { useContext, useEffect, useState } from "react";
import BeatLoader from "react-spinners/BeatLoader";
import Image from "next/image";
import { BankIdContext } from "../BankIdContext";
import MethodFooter from "../MethodFooter";

const QRCodeView = () => {
  const { state, dispatch } = useContext(BankIdContext);
  const { qrCodeImage, identification, hasTimedOut, hasError, retriggerAuth } =
    state;

  const openQRCode = () => {
    dispatch({ type: "SET_VIEW", payload: "qrcode" });
    retriggerAuth();
  };

  const openAutoStart = () => {
    dispatch({ type: "SET_VIEW", payload: "qrcode" });
    retriggerAuth();
  };

  const statusTitle = hasTimedOut
    ? "BankID verifikation tog för lång tid"
    : hasError
    ? "Kunde inte verifiera BankID"
    : "";

  return (
    <div className="p-5 w-full">
      {(hasTimedOut && !identification) || hasError ? (
        <Alert
          variant="outlined"
          color="red"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          }
        >
          <div className="flex flex-col space-y-4 my-8">
            <h3>{statusTitle}</h3>
            <p>
              Försök igen genom att klicka på knappen nedan. Om problemet
              kvarstår, pröva en annan enhet.
            </p>
            <a
              href="https://install.bankid.com/"
              target="_blank"
              rel="noreferrer"
            >
              Installera BankID säkerhetsapp
            </a>
          </div>
        </Alert>
      ) : (
        <div>
          {!qrCodeImage ? (
            <div className="flex justify-center">
              <BeatLoader color="#183e4f" />
            </div>
          ) : (
            <div className="bg-aliceblue px-6 py-8 relative text-center rounded-lg">
              <div className="flex justify-center items-center relative">
                <svg
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-0 cursor-pointer transition-all duration-200 hover:-translate-x-[2px]"
                  onClick={() => dispatch({ type: "SET_VIEW", payload: "" })}
                >
                  <path
                    d="M4.325 9L9.925 14.6L8.5 16L0.5 8L8.5 0L9.925 1.4L4.325 7H16.5V9H4.325Z"
                    fill="#2D2D32"
                  />
                </svg>

                <h2 className="text-center font-semibold" onClick={openQRCode}>
                  Starta BankID-appen
                </h2>
              </div>

              <p className="text-profile-gray-dark font-light text-16 text-center my-6">
                Starta Bank-id appen och tryck på QR-ikonen. Läs sedan av den
                här QR-koden.
              </p>

              <Image
                src={qrCodeImage}
                className="mx-auto my-8"
                alt="QR Code"
                width={150}
                height={150}
              />

              <span
                className="text-blue font-semibold cursor-pointer"
                onClick={openAutoStart}
                role="button"
              >
                Öppna BankId på den här enheten istället
              </span>
            </div>
          )}
        </div>
      )}

      <MethodFooter reTriggerView="authentication" />
    </div>
  );
};

export default QRCodeView;
