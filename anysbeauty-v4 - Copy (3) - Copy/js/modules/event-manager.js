import { database, ref, onValue, set, update, remove, get } from './firebase-config.js';
import { showToast } from './ui-utilities.js';

// Events management for homepage banners
export let events = [];
let eventsListeners = [];

export function onEventsChange(callback) {
  eventsListeners.push(callback);
  return () => {
    eventsListeners = eventsListeners.filter(listener => listener !== callback);
  };
}

function notifyEventsListeners() {
  eventsListeners.forEach(callback => callback(events));
}

// Load all events
export function loadEvents() {
  return new Promise((resolve, reject) => {
    try {
      const eventsRef = ref(database, 'events');
      
      const unsubscribe = onValue(eventsRef, (snapshot) => {
        if (snapshot.exists()) {
          events = Object.keys(snapshot.val()).map(key => ({
            id: key,
            ...snapshot.val()[key]
          }));
        } else {
          events = [];
        }
        
        notifyEventsListeners();
        resolve(events);
      }, (error) => {
        reject(error);
      });
      
      return unsubscribe;
    } catch (error) {
      reject(error);
    }
  });
}

// Get active events for homepage (max 3)
export function getActiveEvents() {
  return events
    .filter(event => event.isActive)
    .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99))
    .slice(0, 3);
}

// Add new event
export async function addEvent(eventData) {
  try {
    const eventId = 'event_' + Date.now();
    const eventRef = ref(database, `events/${eventId}`);
    
    const event = {
      id: eventId,
      title: eventData.title || '',
      description: eventData.description || '',
      imageUrl: eventData.imageUrl || '',
      isActive: eventData.isActive || false,
      displayOrder: eventData.displayOrder || 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(eventRef, event);
    showToast('ইভেন্ট সফলভাবে যোগ করা হয়েছে!', 'success');
    return event;
  } catch (error) {
    showToast('ইভেন্ট যোগ করতে সমস্যা হয়েছে!', 'error');
    throw error;
  }
}

// Update event
export async function updateEvent(eventId, eventData) {
  try {
    const eventRef = ref(database, `events/${eventId}`);
    
    const updates = {
      ...eventData,
      updatedAt: new Date().toISOString()
    };
    
    await update(eventRef, updates);
    showToast('ইভেন্ট সফলভাবে আপডেট করা হয়েছে!', 'success');
    return updates;
  } catch (error) {
    showToast('ইভেন্ট আপডেট করতে সমস্যা হয়েছে!', 'error');
    throw error;
  }
}

// Delete event
export async function deleteEvent(eventId) {
  try {
    const eventRef = ref(database, `events/${eventId}`);
    await remove(eventRef);
    showToast('ইভেন্ট সফলভাবে ডিলিট করা হয়েছে!', 'success');
    return true;
  } catch (error) {
    showToast('ইভেন্ট ডিলিট করতে সমস্যা হয়েছে!', 'error');
    throw error;
  }
}

// Toggle event active status
export async function toggleEventActive(eventId, isActive) {
  try {
    const eventRef = ref(database, `events/${eventId}`);
    await update(eventRef, {
      isActive: isActive,
      updatedAt: new Date().toISOString()
    });
    
    const message = isActive ? 'ইভেন্ট সক্রিয় করা হয়েছে!' : 'ইভেন্ট নিষ্ক্রিয় করা হয়েছে!';
    showToast(message, 'success');
    return true;
  } catch (error) {
    showToast('স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে!', 'error');
    throw error;
  }
}

// Get event by ID
export function getEventById(eventId) {
  return events.find(event => event.id === eventId);
}