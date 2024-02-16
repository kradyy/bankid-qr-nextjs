import fs from "fs";

const BASE_CERT_PATH = process.cwd() + '/certs';
const BANKID_API_VERSION = '6.0';

export const config = {
    mobileBankIdPolicy: '1.2.3.4.25',
    bankdIdUrl: `https://appapi2.test.bankid.com/rp/v${BANKID_API_VERSION}`,
    pfx: fs.readFileSync(`${BASE_CERT_PATH}/FPTestcert4_20230629.p12`),
    passphrase: 'qwerty123',
    ca: fs.readFileSync(`${BASE_CERT_PATH}/BankIdTest.ca`),
};
