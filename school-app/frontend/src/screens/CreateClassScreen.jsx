import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BASE_URL = 'https://lms-school-app.onrender.com/api/v1';

const CreateClassScreen = ({ navigation }) => {
  const [className, setClassName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH STUDENTS ================= */
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setStudents(json.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load students');
    }
  };

  /* ================= TOGGLE STUDENT ================= */
  const toggleStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  };

  /* ================= CREATE CLASS ================= */
  const handleCreateClass = async () => {
    if (!className || !sectionName) {
      return Alert.alert('Error', 'Class name & section required');
    }

    if (selectedStudents.length === 0) {
      return Alert.alert('Error', 'Select at least one student');
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      // 1️⃣ Create Class
      const classRes = await fetch(`${BASE_URL}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          class_name: className,
          section_name: sectionName,
        }),
      });

      const classJson = await classRes.json();
      if (!classRes.ok) throw new Error(classJson.message);

      const classId = classJson.data.class_id;

      // 2️⃣ Assign Students
      await fetch(`${BASE_URL}/students/assign-class`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          class_id: classId,
          student_ids: selectedStudents,
        }),
      });

      Alert.alert('Success', 'Class created & students assigned');
      navigation.goBack();

    } catch (err) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER STUDENT ================= */
  const renderStudent = ({ item }) => {
    const selected = selectedStudents.includes(item.student_id);

    return (
      <TouchableOpacity
        style={[
          styles.studentCard,
          selected && styles.studentSelected,
        ]}
        onPress={() => toggleStudent(item.student_id)}
      >
        <Text style={styles.studentName}>{item.full_name}</Text>
        {selected && (
          <MaterialCommunityIcons
            name="check-circle"
            size={22}
            color="#16a34a"
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Class</Text>

      <TextInput
        style={styles.input}
        placeholder="Class Name (eg: 10)"
        value={className}
        onChangeText={setClassName}
      />

      <TextInput
        style={styles.input}
        placeholder="Section (eg: A)"
        value={sectionName}
        onChangeText={setSectionName}
      />

      <Text style={styles.subTitle}>Select Students</Text>

      <FlatList
        data={students}
        keyExtractor={(item) => item.student_id.toString()}
        renderItem={renderStudent}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateClass}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating...' : 'Create Class'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateClassScreen;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 16,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
    color: '#166534',
  },
  input: {
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f0fdf4',
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1fae5',
    marginBottom: 8,
  },
  studentSelected: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  studentName: {
    fontSize: 14,
    color: '#14532d',
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
