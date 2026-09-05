import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { RestaurantProfile, CustomerFeedback, GameDatabase } from '../types';
import { DEFAULT_TABLES, loadGameDatabase } from './storage';

export const DEFAULT_RESTAURANT_ID = 'main-lounge';

export const INITIAL_RESTAURANT_PROFILE: RestaurantProfile = {
  id: DEFAULT_RESTAURANT_ID,
  name: 'Bites & Games Restaurant Lounge',
  googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  adminPin: '1234',
  adminEmail: 'manager@restaurant.com',
  tables: DEFAULT_TABLES,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Fetch or bootstrap restaurant profile from Firestore
 */
export async function getOrInitRestaurantProfile(restaurantId: string = DEFAULT_RESTAURANT_ID): Promise<RestaurantProfile> {
  const path = `restaurants/${restaurantId}`;
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as RestaurantProfile;
      return {
        ...INITIAL_RESTAURANT_PROFILE,
        ...data,
        id: restaurantId,
      };
    } else {
      // Bootstrap default profile in Firestore
      const initial: RestaurantProfile = {
        ...INITIAL_RESTAURANT_PROFILE,
        id: restaurantId,
        customGameQuestions: loadGameDatabase(),
      };
      await setDoc(docRef, initial);
      return initial;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Update restaurant profile
 */
export async function updateRestaurantProfile(
  profileOrId: RestaurantProfile | string,
  partialUpdates?: Partial<RestaurantProfile>
): Promise<void> {
  const id = typeof profileOrId === 'string' ? profileOrId : profileOrId.id;
  const updates = typeof profileOrId === 'string' ? (partialUpdates || {}) : profileOrId;
  const path = `restaurants/${id}`;
  try {
    const docRef = doc(db, 'restaurants', id);
    const cleanData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Save custom game database to restaurant profile
 */
export async function saveRestaurantGameQuestions(restaurantId: string, gameDb: GameDatabase): Promise<void> {
  const path = `restaurants/${restaurantId}`;
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(docRef, {
      customGameQuestions: gameDb,
      tables: gameDb.tables && gameDb.tables.length > 0 ? gameDb.tables : DEFAULT_TABLES,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Submit customer feedback or complaint
 */
export async function submitCustomerFeedback(
  feedback: Omit<CustomerFeedback, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `restaurants/${feedback.restaurantId}/feedbacks/${feedbackId}`;
  try {
    const fullFeedback: CustomerFeedback = {
      ...feedback,
      id: feedbackId,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    const docRef = doc(db, 'restaurants', feedback.restaurantId, 'feedbacks', feedbackId);
    await setDoc(docRef, fullFeedback);
    return feedbackId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update feedback status / resolution notes by staff
 */
export async function updateFeedbackResolution(
  restaurantId: string,
  feedbackId: string,
  status: CustomerFeedback['status'],
  resolutionNotes?: string
): Promise<void> {
  const path = `restaurants/${restaurantId}/feedbacks/${feedbackId}`;
  try {
    const docRef = doc(db, 'restaurants', restaurantId, 'feedbacks', feedbackId);
    await updateDoc(docRef, {
      status,
      resolutionNotes: resolutionNotes || '',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Real-time subscription to restaurant feedbacks
 */
export function subscribeToRestaurantFeedbacks(
  restaurantId: string,
  onFeedbacks: (feedbacks: CustomerFeedback[]) => void
): () => void {
  const path = `restaurants/${restaurantId}/feedbacks`;
  try {
    const q = query(
      collection(db, 'restaurants', restaurantId, 'feedbacks'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const items: CustomerFeedback[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as CustomerFeedback);
        });
        onFeedbacks(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
