import useBankId from "@/hooks/useBankId";
import React, { useContext, useEffect, useMemo, useReducer } from "react";
import IdentificationView from "./IdentificationView";
import AuthenticationView from "./AuthenticationView";
import { AuthenticationContext } from "../layout/Authentication/Wrapper";
import { BankIdContext } from "./BankIdContext";

interface BankIdWrapperProps {
  authenticatedComponent?: React.ComponentType<{
    identification: any;
    bankId: any;
  }> | null;
  onAuthenticated?: any;
  bankIdTitle?: string;
  bankIdDescription?: string;
  bankIdOptions?: any;
}

export default function BankIdWrapper({
  onAuthenticated,
  bankIdDescription,
  bankIdTitle,
  authenticatedComponent: AuthenticatedComponent = null,
  bankIdOptions = {},
}: BankIdWrapperProps) {
  const bankId = useBankId(bankIdOptions);

  const {
    qrCodeImage,
    identification,
    hasError,
    hasTimedOut,
    retriggerAuth,
    reset,
  } = bankId;

  console.log("hasError", hasError);
  console.log("hasTimedout", hasTimedOut);
  console.log("identification", identification);

  const identificationStatus = useMemo(
    () => identification?.status,
    [identification?.status]
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
    hasTimedOut,
    hasError,
    retriggerAuth,
    reset,
    view: "",
  };

  const [state, dispatch] = useReducer(bankIdReducer, initialState);
  const view = state?.view;

  useEffect(() => {
    dispatch({ type: "SET_BANKID_DATA", payload: bankId });
  }, [identification, hasTimedOut, hasError, qrCodeImage]);

  const openIdentification = () => {
    dispatch({ type: "SET_VIEW", payload: "identification" });
    retriggerAuth();
  };

  const openSignIn = () => {
    dispatch({ type: "SET_VIEW", payload: "authentication" });
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

  const identificationData = identification;

  return (
    <BankIdContext.Provider value={{ state, dispatch }}>
      <div className="w-full">
        {identification?.status === "complete" && AuthenticatedComponent && (
          <AuthenticatedComponent
            identification={identificationData}
            bankId={bankId}
          />
        )}
        {identification?.status !== "complete" && view === "identification" ? (
          <IdentificationView />
        ) : null}
        {identification?.status !== "complete" && view === "authentication" ? (
          <AuthenticationView />
        ) : null}
        {identification?.status !== "complete" && view === "" ? (
          <div className="flex flex-col space-y-8">
            <button
              onClick={openSignIn}
              className="p-4 bg-blue font-semibild text-white justify-center text-md"
              borderColor="transparent"
              icon="bankid"
              iconDirection="left"
            >
              Mobilt BankID på annan enhet
            </button>
            <button
              className="p-4 bg-transparent font-semibild text-blue justify-center text-md"
              borderColor="blue"
              onClick={openIdentification}
              icon="bankid"
              iconDirection="left"
            >
              BankID på denna enheten
            </button>
          </div>
        ) : null}

        <div className="flex flex-col space-y-4 my-8">
          <strong>{bankIdTitle}</strong>
          <p>{bankIdDescription}</p>
        </div>
      </div>
    </BankIdContext.Provider>
  );
}
