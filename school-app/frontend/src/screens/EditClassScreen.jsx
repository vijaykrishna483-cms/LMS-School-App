import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/Header';
import { COLORS } from '../constants/colors';

const BASE_URL = 'https://lms-school-app.onrender.com/api/v1';

const EditClassDetailsScreen = ({ route, navigation }) => {
  /* ================= SAFE PARAMS ================= */
  const params = route?.params ?? {};
  const classId = params.classId;
  const className = params.className ?? '';
  const sectionName = params.sectionName ?? '';

  if (!classId) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>Invalid class selected</Text>
      </View>
    );
  }

  /* ================= STATE ================= */
  const [classStudents, setClassStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showingClassStudents, setShowingClassStudents] = useState(true);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      /* 1️⃣ Get class + its students */
      const classRes = await fetch(`${BASE_URL}/classes/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const classJson = await classRes.json();

      if (!classRes.ok) {
        throw new Error(classJson.message || 'Failed to load class');
      }

      const studentsInClass = classJson.data.students || [];
      setClassStudents(studentsInClass);

      /* 2️⃣ Get ALL students */
      const allRes = await fetch(`${BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allJson = await allRes.json();

      const others = (allJson.data || []).filter(
        (s) => s.class_id !== classId
      );

      setAllStudents(others);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  /* ================= ADD STUDENT ================= */
  const addStudent = async (studentId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      await fetch(`${BASE_URL}/classes/assign-class`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          class_id: classId,
          student_ids: [studentId],
        }),
      });

      loadData();
    } catch {
      Alert.alert('Error', 'Failed to add student');
    }
  };

  /* ================= REMOVE STUDENT ================= */
  const removeStudent = async (studentId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      await fetch(`${BASE_URL}/students/remove-from-class`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId }),
      });

      loadData();
    } catch {
      Alert.alert('Error', 'Failed to remove student');
    }
  };

  /* ================= RENDERS ================= */
  const renderClassStudent = ({ item }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => removeStudent(item.student_id)}
    >
      <Text style={styles.studentName}>{item.full_name}</Text>
      <MaterialCommunityIcons name="minus-circle" size={22} color="#dc2626" />
    </TouchableOpacity>
  );

  const renderOtherStudent = ({ item }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => addStudent(item.student_id)}
    >
      <Text style={styles.studentName}>{item.full_name}</Text>
      <MaterialCommunityIcons name="plus-circle" size={22} color="#16a34a" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const currentData = showingClassStudents ? classStudents : allStudents;
  const filteredData = currentData.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header
        title={`Class ${className} - ${sectionName}`}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      {/* ===== TOGGLE BUTTON ===== */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            showingClassStudents && styles.toggleButtonActive,
          ]}
          onPress={() => {
            setShowingClassStudents(true);
            setSearchQuery('');
          }}
        >
          <Text
            style={[
              styles.toggleText,
              showingClassStudents && styles.toggleTextActive,
            ]}
          >
            Class Students ({classStudents.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            !showingClassStudents && styles.toggleButtonActive,
          ]}
          onPress={() => {
            setShowingClassStudents(false);
            setSearchQuery('');
          }}
        >
          <Text
            style={[
              styles.toggleText,
              !showingClassStudents && styles.toggleTextActive,
            ]}
          >
            All Students ({allStudents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== SEARCH BAR ===== */}
      <TextInput
        style={styles.search}
        placeholder={`Search ${showingClassStudents ? 'class' : 'all'} students`}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* ===== STUDENT LIST ===== */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.student_id.toString()}
        renderItem={showingClassStudents ? renderClassStudent : renderOtherStudent}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {showingClassStudents
              ? 'No students in this class'
              : 'No students available to add'}
          </Text>
        }
      />
    </View>
  );
};

export default EditClassDetailsScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    marginTop: 12,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: COLORS.primary,
  },
  search: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 6,
    backgroundColor: '#ffffff',
  },
  studentName: {
    fontSize: 14,
    color: COLORS.text,
  },
  empty: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginVertical: 10,
  },
});