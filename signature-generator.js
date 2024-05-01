import crypto from "crypto";
import dotenv from 'dotenv';
dotenv.config();

// Your secret key
const secretKey = "12345";

// Message data
const messageData = `
{
    "transactions": [
        {
            "id": "49f1cb10-0202-0138-225b-028e897a70a5",
            "created_at": "2019-12-16T07:19:14.966Z",
            "updated_at": "2019-12-16T07:19:14.968Z",
            "description": "Credit of $100.00 to Wallet Account by Debit of $100.00 from NPP Payin Funding Account",
            "type": "deposit",
            "type_method": "npp_payin",
            "state": "successful",
            "user_id": "f5b8c1c7-2d7e-4c3f-a5c7-d25e2fc9205d",
            "user_name": "Neol Buyer",
            "amount": "100.00",
            "currency": "AUD",
            "debit_credit": "credit"
        },
        {
            "id": "49f1cb10-0202-0138-225b-028e897a70a6",
            "created_at": "2019-12-16T07:19:14.966Z",
            "updated_at": "2019-12-16T07:19:14.968Z",
            "description": "Credit of $100.00 to Wallet Account by Debit of $100.00 from NPP Payin Funding Account",
            "type": "deposit",
            "type_method": "npp_payin",
            "state": "successful",
            "user_id": "f5b8c1c7-2d7e-4c3f-a5c7-d25e2fc9205d",
            "user_name": "Neol Buyer",
            "amount": "100.00",
            "currency": "AUD",
            "debit_credit": "credit"
        }
    ]
}
`;

// Convert message data to a JSON string
const generatedSignature = crypto
  .createHmac("sha256", process.env.HMAC_SECRET || 'DEFAULT_SECRET')
  .update(JSON.stringify(JSON.parse(messageData)))
  .digest("hex");

console.log(generatedSignature);
