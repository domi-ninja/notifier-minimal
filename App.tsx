import "./global.css";
import { StatusBar } from 'expo-status-bar';
import { View, ScrollView, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { ConvexReactClient, useQuery, useMutation, useConvexAuth } from 'convex/react';
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import * as SecureStore from 'expo-secure-store';
import { api } from './convex/_generated/api';
import { useState, createContext, useContext } from 'react';

// Storage adapter for React Native using expo-secure-store
const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// Auth context
const AuthContext = createContext<{ logout: () => void } | null>(null);

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContext");
  return ctx;
}

// Login screen component
function LoginScreen() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim()) {
      setError('Please enter an email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await signIn("password", {
        email,
        password,
        flow: isSignUp ? "signUp" : "signIn",
      });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-neutral-100 justify-center items-center p-5">
      <View className="bg-white rounded-2xl p-8 w-full max-w-[400px] shadow-lg">
        <Text className="text-3xl font-bold text-center mb-2 text-gray-800">Numbers Demo</Text>
        <Text className="text-base text-gray-500 text-center mb-6">{isSignUp ? 'Create an account' : 'Sign in to continue'}</Text>

        <TextInput
          className="border border-gray-300 rounded-lg p-3.5 text-base mb-4 bg-neutral-50"
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          className="border border-gray-300 rounded-lg p-3.5 text-base mb-4 bg-neutral-50"
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          onSubmitEditing={handleAuth}
        />

        {error ? <Text className="text-danger text-sm mb-4 text-center">{error}</Text> : null}

        <TouchableOpacity className="bg-primary py-3.5 rounded-lg items-center" onPress={handleAuth} disabled={loading}>
          <Text className="text-white text-lg font-semibold">{loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => setIsSignUp(!isSignUp)}>
          <Text className="text-gray-500 text-sm">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// This will be set by Convex CLI during development
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || '';

const convex = new ConvexReactClient(CONVEX_URL);

function NumbersApp() {
  const { logout } = useAuth();

  const numbers = useQuery(api.numbers.list);
  const createNumber = useMutation(api.numbers.create);
  const updateNumber = useMutation(api.numbers.update);
  const deleteNumber = useMutation(api.numbers.remove);

  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCreate = async () => {
    const value = parseFloat(newValue);
    if (isNaN(value)) {
      return;
    }
    await createNumber({ value });
    setNewValue('');
  };

  const handleUpdate = async (id: string) => {
    const value = parseFloat(editValue);
    if (isNaN(value)) {
      return;
    }
    await updateNumber({ id: id as any, value });
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = async (id: string) => {
    await deleteNumber({ id: id as any });
  };

  const startEditing = (id: string, currentValue: number) => {
    setEditingId(id);
    setEditValue(currentValue.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  if (numbers === undefined) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-base text-gray-500">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-border bg-neutral-50">
          <Text className="text-xl font-bold text-gray-800">Numbers Demo</Text>
          <TouchableOpacity
            className="bg-danger px-4 py-2 rounded-lg"
            onPress={logout}
          >
            <Text className="text-white font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Add Number Form */}
        <View className="p-4 border-b border-border">
          <Text className="text-lg font-semibold mb-3 text-gray-800">Add a Number</Text>
          <View className="flex-row gap-3">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg p-3 text-base bg-white"
              placeholder="Enter a number"
              placeholderTextColor="#999"
              value={newValue}
              onChangeText={setNewValue}
              keyboardType="numeric"
              onSubmitEditing={handleCreate}
            />
            <TouchableOpacity
              className="bg-primary px-6 rounded-lg justify-center items-center"
              onPress={handleCreate}
            >
              <Text className="text-white font-semibold">Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Numbers List */}
        <View className="p-4">
          <Text className="text-lg font-semibold mb-3 text-gray-800">Your Numbers</Text>

          {numbers.length === 0 ? (
            <View className="p-8 items-center bg-neutral-50 rounded-lg">
              <Text className="text-base text-gray-500 text-center">No numbers yet. Add one above!</Text>
            </View>
          ) : (
            <View className="gap-2">
              {numbers.map((num) => (
                <View
                  key={num._id}
                  className="flex-row items-center justify-between p-4 bg-neutral-50 rounded-lg border border-border"
                >
                  {editingId === num._id ? (
                    // Edit mode
                    <View className="flex-1 flex-row items-center gap-2">
                      <TextInput
                        className="flex-1 border border-primary rounded-lg p-2 text-base bg-white"
                        value={editValue}
                        onChangeText={setEditValue}
                        keyboardType="numeric"
                        autoFocus
                        onSubmitEditing={() => handleUpdate(num._id)}
                      />
                      <TouchableOpacity
                        className="bg-primary px-4 py-2 rounded-lg"
                        onPress={() => handleUpdate(num._id)}
                      >
                        <Text className="text-white font-semibold">Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-gray-400 px-4 py-2 rounded-lg"
                        onPress={cancelEditing}
                      >
                        <Text className="text-white font-semibold">Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // View mode
                    <>
                      <Text className="text-2xl font-bold text-gray-800">{num.value}</Text>
                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          className="bg-primary px-4 py-2 rounded-lg"
                          onPress={() => startEditing(num._id, num.value)}
                        >
                          <Text className="text-white font-semibold">Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="bg-danger px-4 py-2 rounded-lg"
                          onPress={() => handleDelete(num._id)}
                        >
                          <Text className="text-white font-semibold">Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  const handleLogout = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-base text-gray-500">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      <NumbersApp />
    </AuthContext.Provider>
  );
}

export default function App() {
  if (!CONVEX_URL) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-4">
        <Text className="text-base text-danger text-center p-4">
          Convex URL not configured. Please set EXPO_PUBLIC_CONVEX_URL environment variable.
        </Text>
        <Text className="text-base text-danger text-center p-4">
          Run: npx convex dev
        </Text>
      </View>
    );
  }

  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <AuthenticatedApp />
    </ConvexAuthProvider>
  );
}
