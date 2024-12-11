import CryptoJS from "crypto-js";

export const decrypt = (data: string) => {
  try {
    // Check if data exists and includes ":" to separate iv and encrypted data
    if (!data || !data.includes(":")) {
      throw new Error("Invalid encrypted data format.");
    }

    // Split data into iv and encrypted part
    const [iv, encryptedData] = data.split(":");

    if (!iv || !encryptedData) {
      throw new Error(
        "Incomplete encryption data: missing iv or encrypted data."
      );
    }

    // Convert iv and encrypted data from hex to WordArray
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);
    const encryptedWordArray = CryptoJS.enc.Hex.parse(encryptedData);

    // Get encryption key from environment variable and parse it as hex
    const keyHex = import.meta.env.VITE_ENCRYPTION_KEY;
    if (!keyHex) {
      throw new Error(
        "Encryption key is not defined in the environment variables."
      );
    }
    const key = CryptoJS.enc.Hex.parse(keyHex);

    // Create CipherParams object
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: encryptedWordArray,
    });

    // Decrypt the data using AES
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: ivWordArray,
    });

    // Convert decrypted data to UTF-8
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText) {
      throw new Error(
        "Failed to decrypt data. Possible key mismatch or data corruption."
      );
    }

    return decryptedText;
  } catch (error) {
    console.error("Decryption error:", error.message);
    throw error; // Rethrow or handle as needed
  }
};
