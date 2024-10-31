# Next.js with BankID (QR Code) Integration Guide

This guide details how to integrate BankID authentication into a Next.js application, utilizing a custom hook and API route for handling BankID operations.

## Prerequisites

Before you begin, ensure you have:

- A Next.js project set up (version 13 or above).
- Basic understanding of React hooks and Next.js API routes.
- Access to BankID test credentials (see setup below).

## BankID Test Environment Setup

1. Visit the [BankID Developers Guide](https://www.bankid.com/utvecklare/guider) to obtain your test credentials and set up your BankID test environment.
2. Follow the instructions to register for a test account and download your certificate files.
3. Configure your environment variables for the BankID API URL, certificate (`.pfx` file), passphrase, and CA root certificate as needed.

## Integration Steps

### Step 1: API Route Setup

Create an API route `pages/api/bankid.ts` to handle BankID authentication requests. This route will use `axios` for HTTP requests and handle various BankID operations like authentication (`auth`), QR code generation (`refresh-qr`), and status collection (`collect`).

### Step 2: Custom Hook

Use the custom hook `useBankIdQrCode` in your component to initiate and manage BankID authentication processes. This hook manages the authentication flow, QR code generation, and polling for authentication status.

### Step 3: Implementing the Frontend

Use the custom hook within your React components to display the QR code and manage the authentication state. A demo component is provided to illustrate how to use the hook.

## Example Usage

Below is an example of how to use the custom hook in a Next.js component to display the BankID QR code and handle authentication status.

```jsx
import React, { useEffect } from "react";
import useBankIdQrCode from "hooks/useBankIdQrCode";
import BeatLoader from "react-spinners/BeatLoader";

const BankIDClient = () => {
  const { qrCodeImage, identification, hasTimedOut, retriggerAuth } =
    useBankIdQrCode();

  useEffect(() => {
    retriggerAuth();
  }, []);

  // Success
  if (identification) {
    console.log("identified as", identification?.completionData);
  }

  return (
    <div>
      {hasTimedOut && !identification ? (
        <>
          <button onClick={retriggerAuth}>Retry</button>
          <span>BankID timed out</span>
        </>
      ) : !qrCodeImage ? (
        <BeatLoader color="#183e4f" />
      ) : (
        <img src={qrCodeImage} alt="QR Code" />
      )}
    </div>
  );
};

export default BankIDClient;
```
