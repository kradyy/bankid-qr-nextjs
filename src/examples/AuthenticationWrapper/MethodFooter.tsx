import Button from "@/components/elements/Button";
import { useContext } from "react";
import { BankIdContext } from "@/components/BankId/BankIdContext";

interface MethodFooterProps {
  reTriggerView: string;
  cancelAction?: () => void;
  tryAgainAction?: () => void;
}

const MethodFooter: React.FC<MethodFooterProps> = ({
  reTriggerView,
  cancelAction,
  tryAgainAction,
}) => {
  const { state, dispatch } = useContext(BankIdContext);

  const { hasTimedOut, hasError, retriggerAuth } = state;

  // Default actions for cancelAction and tryAgainAction if not provided
  const handleCancelAction =
    cancelAction || (() => dispatch({ type: "SET_VIEW", payload: "" }));

  const handleTryAgainAction =
    tryAgainAction ||
    (() => {
      dispatch({ type: "SET_VIEW", payload: reTriggerView });
      retriggerAuth();
    });

  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex flex-row space-x-4 mt-6">
        <Button
          bgColor="white"
          className="text-black !border !border-black mx-auto text-md mt-4"
          onClick={handleCancelAction}
        >
          Avbryt
        </Button>
        {(hasTimedOut || hasError) && (
          <Button
            bgColor="blue"
            className="p-4 text-white !border !border-blue mx-auto text-md mt-4"
            onClick={handleTryAgainAction}
          >
            Försök igen
          </Button>
        )}
      </div>
    </div>
  );
};

export default MethodFooter;
