import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { COLORS } from '../constants/colors';

const BASE_URL = 'https://lms-school-app.onrender.com/api/v1';

const MarksEntryScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [marks, setMarks] = useState('');

  const [searchClass, setSearchClass] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [searchExam, setSearchExam] = useState('');
  const [searchSubject, setSearchSubject] = useState('');

  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const getToken = async () => AsyncStorage.getItem('userToken');

  const loadClasses = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setClasses(json.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setStudents(json.data.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadExams = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/exams/class/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setExams(json.data || []);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const loadSubjects = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/subjects/class/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setSubjects(json.data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const saveMarks = async () => {
    if (!selectedClass || !selectedStudent || !selectedExam || !selectedSubject || !marks) {
      return Alert.alert('Error', 'All fields are required');
    }

    const marksNum = Number(marks);
    if (isNaN(marksNum) || marksNum < 0) {
      return Alert.alert('Error', 'Please enter valid marks');
    }

    if (marksNum > selectedExam.max_marks) {
      return Alert.alert('Error', `Marks cannot exceed ${selectedExam.max_marks}`);
    }

    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch(`${BASE_URL}/marks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exam_id: selectedExam.exam_id,
          marks_records: [
            {
              student_id: selectedStudent.student_id,
              subject_id: selectedSubject.subject_id,
              marks_scored: marksNum,
            },
          ],
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to save marks');
      }

      Alert.alert('Success', 'Marks saved successfully!', [
        {
          text: 'Add More',
          onPress: () => {
            setMarks('');
            setSelectedStudent(null);
            setSelectedSubject(null);
          },
        },
        {
          text: 'Done',
          onPress: () => {
            setMarks('');
            setSelectedStudent(null);
            setSelectedSubject(null);
            setSelectedExam(null);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  const DropdownItem = ({ label, onPress, isSelected, icon }) => (
    <TouchableOpacity 
      style={[styles.option, isSelected && styles.optionSelected]} 
      onPress={onPress}
    >
      <View style={styles.optionContent}>
        {icon && <Ionicons name={icon} size={18} color={isSelected ? COLORS.primary : COLORS.textLight} />}
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {label}
        </Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Marks Entry" showBack onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Select class, student, exam, subject and enter marks
          </Text>
        </View>

        {/* Class Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            <Ionicons name="school" size={16} color={COLORS.text} /> Select Class
          </Text>
          <TouchableOpacity
            style={[styles.dropdown, selectedClass && styles.dropdownFilled]}
            onPress={() => setOpen(open === 'class' ? null : 'class')}
          >
            <Text style={[styles.dropdownText, selectedClass && styles.dropdownTextFilled]}>
              {selectedClass 
                ? `${selectedClass.class_name}-${selectedClass.section_name}` 
                : 'Choose class'}
            </Text>
            <Ionicons 
              name={open === 'class' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={selectedClass ? COLORS.primary : COLORS.textLight}
            />
          </TouchableOpacity>

          {open === 'class' && (
            <View style={styles.dropdownBox}>
              <TextInput
                placeholder="Search class..."
                value={searchClass}
                onChangeText={setSearchClass}
                style={styles.search}
                placeholderTextColor={COLORS.textLight}
              />
              <FlatList
                data={classes.filter((c) =>
                  `${c.class_name}${c.section_name}`
                    .toLowerCase()
                    .includes(searchClass.toLowerCase())
                )}
                keyExtractor={(i) => i.class_id.toString()}
                renderItem={({ item }) => (
                  <DropdownItem
                    label={`${item.class_name}-${item.section_name}`}
                    icon="school-outline"
                    isSelected={selectedClass?.class_id === item.class_id}
                    onPress={() => {
                      setSelectedClass(item);
                      setSelectedStudent(null);
                      setSelectedExam(null);
                      setSelectedSubject(null);
                      setStudents([]);
                      setExams([]);
                      setSubjects([]);
                      loadStudents(item.class_id);
                      loadExams(item.class_id);
                      loadSubjects(item.class_id);
                      setOpen(null);
                      setSearchClass('');
                    }}
                  />
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No classes found</Text>
                }
              />
            </View>
          )}
        </View>

        {/* Student Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            <Ionicons name="person" size={16} color={COLORS.text} /> Select Student
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdown, 
              selectedStudent && styles.dropdownFilled,
              !selectedClass && styles.dropdownDisabled
            ]}
            onPress={() => selectedClass && setOpen(open === 'student' ? null : 'student')}
            disabled={!selectedClass}
          >
            <Text style={[
              styles.dropdownText, 
              selectedStudent && styles.dropdownTextFilled,
              !selectedClass && styles.dropdownTextDisabled
            ]}>
              {selectedStudent ? `${selectedStudent.full_name} (Roll: ${selectedStudent.roll_no})` : 'Choose student'}
            </Text>
            <Ionicons 
              name={open === 'student' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={selectedStudent ? COLORS.primary : COLORS.textLight}
            />
          </TouchableOpacity>

          {open === 'student' && (
            <View style={styles.dropdownBox}>
              <TextInput
                placeholder="Search student..."
                value={searchStudent}
                onChangeText={setSearchStudent}
                style={styles.search}
                placeholderTextColor={COLORS.textLight}
              />
              <FlatList
                data={students.filter((s) =>
                  s.full_name.toLowerCase().includes(searchStudent.toLowerCase()) ||
                  s.roll_no.toString().includes(searchStudent)
                )}
                keyExtractor={(i) => i.student_id.toString()}
                renderItem={({ item }) => (
                  <DropdownItem
                    label={`${item.full_name} (Roll: ${item.roll_no})`}
                    icon="person-outline"
                    isSelected={selectedStudent?.student_id === item.student_id}
                    onPress={() => {
                      setSelectedStudent(item);
                      setOpen(null);
                      setSearchStudent('');
                    }}
                  />
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No students found</Text>
                }
              />
            </View>
          )}
        </View>

        {/* Exam Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            <Ionicons name="document-text" size={16} color={COLORS.text} /> Select Exam
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdown, 
              selectedExam && styles.dropdownFilled,
              !selectedClass && styles.dropdownDisabled
            ]}
            onPress={() => selectedClass && setOpen(open === 'exam' ? null : 'exam')}
            disabled={!selectedClass}
          >
            <Text style={[
              styles.dropdownText, 
              selectedExam && styles.dropdownTextFilled,
              !selectedClass && styles.dropdownTextDisabled
            ]}>
              {selectedExam ? `${selectedExam.exam_name} (Max: ${selectedExam.max_marks})` : 'Choose exam'}
            </Text>
            <Ionicons 
              name={open === 'exam' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={selectedExam ? COLORS.primary : COLORS.textLight}
            />
          </TouchableOpacity>

          {open === 'exam' && (
            <View style={styles.dropdownBox}>
              <TextInput
                placeholder="Search exam..."
                value={searchExam}
                onChangeText={setSearchExam}
                style={styles.search}
                placeholderTextColor={COLORS.textLight}
              />
              <FlatList
                data={exams.filter((e) =>
                  e.exam_name.toLowerCase().includes(searchExam.toLowerCase())
                )}
                keyExtractor={(i) => i.exam_id.toString()}
                renderItem={({ item }) => (
                  <DropdownItem
                    label={`${item.exam_name} (Max: ${item.max_marks})`}
                    icon="document-text-outline"
                    isSelected={selectedExam?.exam_id === item.exam_id}
                    onPress={() => {
                      setSelectedExam(item);
                      setOpen(null);
                      setSearchExam('');
                    }}
                  />
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No exams found. Create one in View Grades!</Text>
                }
              />
            </View>
          )}
        </View>

        {/* Subject Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            <Ionicons name="book" size={16} color={COLORS.text} /> Select Subject
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdown, 
              selectedSubject && styles.dropdownFilled,
              !selectedClass && styles.dropdownDisabled
            ]}
            onPress={() => selectedClass && setOpen(open === 'subject' ? null : 'subject')}
            disabled={!selectedClass}
          >
            <Text style={[
              styles.dropdownText, 
              selectedSubject && styles.dropdownTextFilled,
              !selectedClass && styles.dropdownTextDisabled
            ]}>
              {selectedSubject ? selectedSubject.subject_name : 'Choose subject'}
            </Text>
            <Ionicons 
              name={open === 'subject' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={selectedSubject ? COLORS.primary : COLORS.textLight}
            />
          </TouchableOpacity>

          {open === 'subject' && (
            <View style={styles.dropdownBox}>
              <TextInput
                placeholder="Search subject..."
                value={searchSubject}
                onChangeText={setSearchSubject}
                style={styles.search}
                placeholderTextColor={COLORS.textLight}
              />
              <FlatList
                data={subjects.filter((s) =>
                  s.subject_name.toLowerCase().includes(searchSubject.toLowerCase())
                )}
                keyExtractor={(i) => i.subject_id.toString()}
                renderItem={({ item }) => (
                  <DropdownItem
                    label={item.subject_name}
                    icon="book-outline"
                    isSelected={selectedSubject?.subject_id === item.subject_id}
                    onPress={() => {
                      setSelectedSubject(item);
                      setOpen(null);
                      setSearchSubject('');
                    }}
                  />
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No subjects found. Add subjects in View Grades!</Text>
                }
              />
            </View>
          )}
        </View>

        {/* Marks Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            <Ionicons name="create" size={16} color={COLORS.text} /> Marks Scored
            {selectedExam && <Text style={styles.maxMarks}> (Max: {selectedExam.max_marks})</Text>}
          </Text>
          <TextInput
            style={[
              styles.input,
              !selectedClass && styles.inputDisabled
            ]}
            keyboardType="numeric"
            value={marks}
            onChangeText={setMarks}
            placeholder={selectedExam ? `Enter marks (0-${selectedExam.max_marks})` : 'Enter marks scored'}
            placeholderTextColor={COLORS.textLight}
  editable={
    selectedClass !== null &&
    selectedStudent !== null &&
    selectedExam !== null &&
    selectedSubject !== null
  }          />
        </View>

        {/* Summary Card */}
        {selectedClass && selectedStudent && selectedExam && selectedSubject && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.summaryTitle}>Ready to Save</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Class:</Text>
              <Text style={styles.summaryValue}>{selectedClass.class_name}-{selectedClass.section_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Student:</Text>
              <Text style={styles.summaryValue}>{selectedStudent.full_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Exam:</Text>
              <Text style={styles.summaryValue}>{selectedExam.exam_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subject:</Text>
              <Text style={styles.summaryValue}>{selectedSubject.subject_name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Marks:</Text>
              <Text style={[styles.summaryValue, styles.summaryMarks]}>
                {marks || '0'} / {selectedExam.max_marks}
              </Text>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity 
          style={[
            styles.saveBtn,
            (!selectedClass || !selectedStudent || !selectedExam || !selectedSubject || !marks) && styles.saveBtnDisabled
          ]} 
          onPress={saveMarks}
          disabled={!selectedClass || !selectedStudent || !selectedExam || !selectedSubject || !marks || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="save" size={20} color={COLORS.white} />
              <Text style={styles.saveText}>Save Marks</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default MarksEntryScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: { 
    fontWeight: '600', 
    marginBottom: 10, 
    color: COLORS.text,
    fontSize: 15,
  },
  maxMarks: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f9ff',
  },
  dropdownDisabled: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  dropdownText: {
    color: COLORS.textLight,
    fontSize: 15,
    flex: 1,
  },
  dropdownTextFilled: {
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownTextDisabled: {
    color: '#d1d5db',
  },
  dropdownBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 250,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  search: {
    padding: 14,
    borderBottomWidth: 1.5,
    borderColor: '#e5e7eb',
    fontSize: 15,
    color: COLORS.text,
  },
  option: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#f0f9ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionText: {
    color: COLORS.text,
    fontSize: 15,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 14,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    color: '#d1d5db',
  },
  summaryCard: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#86efac',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  summaryMarks: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveText: { 
    color: COLORS.white, 
    fontWeight: '700', 
    fontSize: 16,
    letterSpacing: 0.5,
  },
});