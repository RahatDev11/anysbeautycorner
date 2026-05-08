import { database } from '../firebase';
import { ref, push, set, get, onValue, remove, update } from 'firebase/database';

export const dbService = {
  // Products
  async getProducts() {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
  },

  // Orders
  async createOrder(orderData: any) {
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, {
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    return newOrderRef.key;
  },

  async getOrder(orderId: string) {
    const orderRef = ref(database, `orders/${orderId}`);
    const snapshot = await get(orderRef);
    if (snapshot.exists()) {
      return { id: snapshot.key, ...snapshot.val() };
    }
    return null;
  },

  // Events
  async getEvents() {
    const eventsRef = ref(database, 'events');
    const snapshot = await get(eventsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    }
    return [];
  }
};
