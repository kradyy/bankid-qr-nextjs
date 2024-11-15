import useBankId from "@/hooks/useBankId";
import Button from "@/components/elements/Button";
import React, { useContext, useEffect, useMemo, useReducer } from "react";
import { BankIdContext } from "./BankIdContext";
import QRCodeView from "./methods/QRCode";
import AutoStartView from "./methods/AutoStart";

interface BankIdWrapperProps {
  successComponent?: React.ComponentType<{
    identification: any;
    bankId: any;
  }> | null;
  onAuthenticated?: any;
  bankIdTitle?: string;
  bankIdDescription?: string;
  bankIdOptions?: BankIdOptions;
  debug?: boolean;
}

interface BankIdOptions {
  userVisibleData?: string;
  bankIdMethod?: "sign" | "auth";
  setBankIDSecret?: boolean;
}

export default function BankIdWrapper({
  onAuthenticated,
  bankIdDescription,
  bankIdTitle,
  successComponent: SuccessComponent = null,
  bankIdOptions = {},
  debug = false,
}: BankIdWrapperProps) {
  const bankId = useBankId(bankIdOptions);

  const {
    qrCodeImage,
    identification,
    hasError,
    hasTimedOut,
    startToken,
    autoStartToken,
    retriggerAuth,
    reset,
  } = bankId;

  const identificationStatus = useMemo(
    () => (debug ? "completed" : identification?.status),
    [identification?.status, debug]
  );

  const bankIdReducer = (state: any, action: any) => {
    switch (action.type) {
      case "SET_BANKID_DATA":
        return { ...state, ...action.payload };
      case "SET_VIEW":
        return { ...state, view: action.payload };
      default:
        return state;
    }
  };

  const initialState = {
    qrCodeImage,
    identification,
    autoStartToken,
    hasTimedOut,
    startToken,
    hasError,
    retriggerAuth,
    reset,
    view: "",
  };

  const identificationData = identification;

  const [state, dispatch] = useReducer(bankIdReducer, initialState);
  const view = state?.view;

  useEffect(() => {
    dispatch({
      type: "SET_BANKID_DATA",
      payload: {
        qrCodeImage,
        identification,
        hasTimedOut,
        autoStartToken,
        startToken,
        hasError,
        retriggerAuth,
        reset,
      },
    });
  }, [
    qrCodeImage,
    identification,
    hasTimedOut,
    startToken,
    hasError,
    autoStartToken,
  ]);

  const openAutoStart = () => {
    dispatch({ type: "SET_VIEW", payload: "autostart" });
    retriggerAuth();
  };

  const openQRCode = () => {
    dispatch({ type: "SET_VIEW", payload: "qrcode" });
    retriggerAuth();
  };

  useEffect(() => {
    dispatch({ type: "SET_VIEW", payload: view });
  }, [view]);

  useEffect(() => {
    if (identificationStatus !== "complete" || !onAuthenticated) return;

    onAuthenticated({
      identification,
      bankId,
    });
  }, [identificationStatus]);

  return (
    <BankIdContext.Provider value={{ state, dispatch }}>
      <div className="w-full">
        {identificationData?.status === "complete" && SuccessComponent && (
          <SuccessComponent
            identification={identificationData}
            bankId={bankId}
          />
        )}

        {identificationData?.status !== "complete" && view === "qrcode" ? (
          <QRCodeView />
        ) : null}

        {identificationData?.status !== "complete" && view === "autostart" ? (
          <AutoStartView />
        ) : null}

        {identificationData?.status !== "complete" && view === "" ? (
          <div className="flex flex-col space-y-8">
            <Button
              onClick={openQRCode}
              className="p-4 bg-blue font-semibild text-white justify-center text-md"
              borderColor="transparent"
              icon="bankid"
              iconDirection="left"
            >
              Mobilt BankID på annan enhet
            </Button>
            <Button
              className="p-4 bg-transparent font-semibild text-blue justify-center text-md"
              borderColor="blue"
              onClick={openAutoStart}
              icon="bankid"
              iconDirection="left"
            >
              BankID på denna enheten
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col space-y-4 my-8">
          {bankIdTitle && <strong>{bankIdTitle}</strong>}
          {bankIdDescription && <p>{bankIdDescription}</p>}
        </div>
      </div>
    </BankIdContext.Provider>
  );
}
