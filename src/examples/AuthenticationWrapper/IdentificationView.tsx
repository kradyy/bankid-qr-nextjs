import Alert from "@/components/elements/Alert";
import { useContext, useEffect, useState } from "react";
import FadeLoader from "react-spinners/FadeLoader";
import { BankIdContext } from "@/components/BankId/BankIdContext";
import MethodFooter from "./MethodFooter";

const IdentificationView = () => {
  const { state } = useContext(BankIdContext);

  const { hasTimedOut, startToken } = state;

  useEffect((): void => {
    if (!startToken) {
      return;
    }

    let currentUrl = new URL(window.location.href);
    currentUrl.searchParams.append("challenge", "1234");

    const url = `bankid:///?autostarttoken=${startToken}&redirect=${currentUrl}`;

    window.open(url, "_self");
  }, [startToken]);

  return (
    <>
      {!hasTimedOut ? (
        <div className="flex flex-col justify-center items-center space-y-4 my-8">
          <FadeLoader color="#183e4f" />
          <span className="fs-16">Starta BankID appen</span>
        </div>
      ) : (
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
            <h3>BankID-appen verkar inte finnas i din telefon eller dator</h3>
            <p>
              Beställ BankID via din internetbank och hämta appen i din appbutik
              eller genom att följa länken nedan.
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
      )}

      <MethodFooter reTriggerView="identification" />
    </>
  );
};

export default IdentificationView;
