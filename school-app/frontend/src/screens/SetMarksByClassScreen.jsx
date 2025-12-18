import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const BASE_URL = 'https://lms-school-app.onrender.com/api/v1';

const SetMarksByClassScreen = ({ route, navigation }) => {
  const { classId, className, sectionName } = route.params;

  const [students, setStudents] = useState([]);
  const [openStudentId, setOpenStudentId] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const res = await fetch(`${BASE_URL}/classes/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setStudents(json.data.students || []);
  };

  const renderStudent = ({ item }) => {
    const open = openStudentId === item.student_id;

    return (
      <View style={styles.studentCard}>
        <View style={styles.row}>
          <Text style={styles.studentName}>{item.full_name}</Text>

          <TouchableOpacity
            onPress={() =>
              setOpenStudentId(open ? null : item.student_id)
            }
          >
            <Text style={styles.setMarks}>Set Marks</Text>
          </TouchableOpacity>
        </View>

        {open && (
          <View style={styles.dropdown}>
            <Text style={styles.dropdownText}>
              📋 Exam selection (coming next)
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={`Set Marks - ${className}-${sectionName}`}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={students}
        keyExtractor={(item) => item.student_id.toString()}
        renderItem={renderStudent}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

export default SetMarksByClassScreen;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  studentCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  setMarks: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dropdown: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  dropdownText: {
    color: COLORS.textLight,
  },
});
