import {
  initializePaddle,
  type Paddle,
  type PaddleEventData,
} from '@paddle/paddle-js';

let paddleInstance: Paddle | null = null;
let initPromise: Promise<Paddle | null> | null = null;

export const PADDLE_PRICES = {
  PRO: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID ?? '',
  PREMIUM: process.env.NEXT_PUBLIC_PADDLE_PREMIUM_PRICE_ID ?? '',
} as const;

const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '';
const ENVIRONMENT = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT ?? 'sandbox';

type CheckoutListener = (event: PaddleEventData) => void;
let checkoutListener: CheckoutListener | null = null;

/** Register a global Paddle event callback during initialization. */
function handlePaddleEvent(event: PaddleEventData) {
  if (checkoutListener) {
    checkoutListener(event);
  }
}

export function getPaddle(): Promise<Paddle | null> {
  if (paddleInstance) return Promise.resolve(paddleInstance);
  if (!CLIENT_TOKEN) return Promise.resolve(null);

  if (!initPromise) {
    initPromise = initializePaddle({
      token: CLIENT_TOKEN,
      environment: ENVIRONMENT as 'sandbox' | 'production',
      eventCallback: handlePaddleEvent,
    }).then((paddle) => {
      paddleInstance = paddle ?? null;
      return paddleInstance;
    });
  }

  return initPromise;
}

export type CheckoutResult = 'completed' | 'closed';

/**
 * Opens Paddle checkout and returns a promise that resolves
 * when the checkout is completed or closed.
 */
export async function openCheckout(
  priceId: string,
  email: string,
  userId: string,
): Promise<CheckoutResult> {
  const paddle = await getPaddle();
  if (!paddle) return 'closed';

  return new Promise<CheckoutResult>((resolve) => {
    let resolved = false;

    checkoutListener = (event: PaddleEventData) => {
      if (resolved) return;

      if (event.name === 'checkout.completed') {
        resolved = true;
        checkoutListener = null;
        resolve('completed');
      } else if (event.name === 'checkout.closed') {
        resolved = true;
        checkoutListener = null;
        resolve('closed');
      }
    };

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email },
      customData: { userId },
    });
  });
}
