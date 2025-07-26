import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface UseTripDescriptionLogicProps {
  tripId: string | string[];
}

export const useTripDescriptionLogic = ({
  tripId,
}: UseTripDescriptionLogicProps) => {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    const docRef = firestore().collection('trips').doc(tripId as string);

    const unsubscribe = docRef.onSnapshot(
      doc => {
        if (doc.exists()) {
          const data = doc.data();
          const currentDescription = data?.tripDescription || '';
          setDescription(currentDescription);
          setOriginalDescription(currentDescription);
        } else {
          setDescription('');
          setOriginalDescription('');
          Alert.alert('Error', 'Trip not found.');
          router.back();
        }
        setIsLoading(false);
      },
      error => {
        console.error('Error fetching trip description:', error);
        Alert.alert('Error', 'Failed to load trip description.');
        setIsLoading(false);
        router.back();
      }
    );

    return unsubscribe;
  }, [tripId]);

  const handleSave = async () => {
    if (!tripId) return;

    if (description.trim() === originalDescription.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      await firestore().collection('trips').doc(tripId as string).update({
        tripDescription: description.trim(),
      });
      setOriginalDescription(description.trim());
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save description');
      console.error('Error saving trip description:', error);
    }
  };

  const handleCancel = () => {
    setDescription(originalDescription);
    setIsEditing(false);
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleBackPress = () => {
    router.back();
  };

  const isSaveDisabled = description.trim() === originalDescription.trim();

  return {
    description,
    setDescription,
    isLoading,
    isEditing,
    handleSave,
    handleCancel,
    handleEditPress,
    handleBackPress,
    isSaveDisabled,
  };
};