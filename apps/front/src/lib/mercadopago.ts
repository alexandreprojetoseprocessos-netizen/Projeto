declare global {
  interface Window {
    MercadoPago?: any;
  }
}

const SDK_URL = "https://sdk.mercadopago.com/js/v2";
let sdkPromise: Promise<any> | null = null;
let mpInstance: any | null = null;

const loadSdk = () => {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.MercadoPago) {
      resolve(window.MercadoPago);
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.MercadoPago);
    script.onerror = () => reject(new Error("Falha ao carregar MercadoPago.js."));
    document.body.appendChild(script);
  });
  return sdkPromise;
};

export const getMercadoPago = async (publicKey: string) => {
  if (mpInstance) return mpInstance;
  const MercadoPago = await loadSdk();
  if (!MercadoPago) {
    throw new Error("MercadoPago.js nao disponivel.");
  }
  mpInstance = new MercadoPago(publicKey, { locale: "pt-BR" });
  return mpInstance;
};
