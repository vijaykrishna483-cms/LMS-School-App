import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import Header from '../components/Header';

const BASE_URL = 'https://lms-school-app.onrender.com/api/v1';

const AttendanceScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [searchClass, setSearchClass] = useState('');
  const [openClassDropdown, setOpenClassDropdown] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadExistingAttendance();
    }
  }, [selectedClass, selectedDate]);

  const getToken = async () => AsyncStorage.getItem('userToken');

  const loadClasses = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      setClasses(json.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      Alert.alert('Error', 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/classes/${selectedClass.class_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      setStudents(json.data.students || []);
      setAttendance({});
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAttendance = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${BASE_URL}/attendance/class/${selectedClass.class_id}/date/${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await response.json();

      const attendanceObj = {};
      if (json.data) {
        json.data.forEach((record) => {
          attendanceObj[record.student_id] = record.status;
        });
      }
      setAttendance(attendanceObj);
    } catch (error) {
      console.log('No existing attendance for this date');
      setAttendance({});
    }
  };

  const toggleAttendance = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status,
    }));
  };

  const markAllPresent = () => {
    const allPresent = {};
    students.forEach((student) => {
      allPresent[student.student_id] = 'Present';
    });
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    students.forEach((student) => {
      allAbsent[student.student_id] = 'Absent';
    });
    setAttendance(allAbsent);
  };

  const submitAttendance = async () => {
    if (Object.keys(attendance).length === 0) {
      Alert.alert('Error', 'Please mark attendance for at least one student');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();

      const attendanceRecords = Object.entries(attendance)
        .filter(([_, status]) => status !== null)
        .map(([studentId, status]) => ({
          student_id: parseInt(studentId),
          status: status,
        }));

      await fetch(`${BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          class_id: selectedClass.class_id,
          date: selectedDate,
          attendance_records: attendanceRecords,
        }),
      });

      Alert.alert('Success', 'Attendance marked successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      Alert.alert('Error', error.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const getAttendanceStats = () => {
    const present = Object.values(attendance).filter((s) => s === 'Present').length;
    const absent = Object.values(attendance).filter((s) => s === 'Absent').length;
    const total = students.length;
    return { present, absent, total, unmarked: total - present - absent };
  };

  const stats = getAttendanceStats();

  const DropdownItem = ({ label, onPress, isSelected }) => (
    <TouchableOpacity
      style={[styles.option, isSelected && styles.optionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
        {label}
      </Text>
      {isSelected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title="Mark Attendance" showBack onBackPress={() => navigation.goBack()} />

      {/* Compact Header Section */}
      <View style={styles.compactHeader}>
        {/* Class and Date Row */}
        <View style={styles.selectionRow}>
          {/* Class Selector */}
          <View style={styles.compactField}>
            <Text style={styles.compactLabel}>Class</Text>
            <TouchableOpacity
              style={[styles.compactDropdown, selectedClass && styles.compactDropdownFilled]}
              onPress={() => setOpenClassDropdown(!openClassDropdown)}
            >
              <Text
                style={[
                  styles.compactDropdownText,
                  selectedClass && styles.compactDropdownTextFilled,
                ]}
                numberOfLines={1}
              >
                {selectedClass
                  ? `${selectedClass.class_name}-${selectedClass.section_name}`
                  : 'Select'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={selectedClass ? COLORS.primary : COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Date Display */}
          <View style={styles.compactField}>
            <Text style={styles.compactLabel}>Date</Text>
            <View style={styles.compactDateBox}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.compactDateText}>{selectedDate}</Text>
            </View>
          </View>
        </View>

        {/* Stats & Actions Row */}
        {selectedClass && students.length > 0 && (
          <View style={styles.statsActionsRow}>
            {/* Compact Stats */}
            <View style={styles.compactStats}>
              <View style={styles.compactStatItem}>
                <View style={[styles.statDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.statValue}>{stats.present}</Text>
              </View>
              <View style={styles.compactStatItem}>
                <View style={[styles.statDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.statValue}>{stats.absent}</Text>
              </View>
              <View style={styles.compactStatItem}>
                <View style={[styles.statDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.statValue}>{stats.unmarked}</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.compactActions}>
              <TouchableOpacity
                style={[styles.compactActionBtn, { backgroundColor: '#dcfce7' }]}
                onPress={markAllPresent}
              >
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactActionBtn, { backgroundColor: '#fee2e2' }]}
                onPress={markAllAbsent}
              >
                <Ionicons name="close-circle" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Class Dropdown Modal */}
      {openClassDropdown && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={styles.dropdownBackdrop}
            activeOpacity={1}
            onPress={() => setOpenClassDropdown(false)}
          />
          <View style={styles.dropdownBox}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setOpenClassDropdown(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Search class..."
              value={searchClass}
              onChangeText={setSearchClass}
              style={styles.search}
              placeholderTextColor="#9ca3af"
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
                  label={`Class ${item.class_name}-${item.section_name}`}
                  isSelected={selectedClass?.class_id === item.class_id}
                  onPress={() => {
                    setSelectedClass(item);
                    setOpenClassDropdown(false);
                    setSearchClass('');
                  }}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No classes found</Text>
              }
              style={styles.dropdownList}
            />
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : selectedClass ? (
          <View style={styles.studentListContainer}>
            <Text style={styles.sectionTitle}>Students ({students.length})</Text>
            {students.map((student) => (
              <View key={student.student_id} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.full_name}</Text>
                  <Text style={styles.studentRoll}>Roll: {student.roll_no}</Text>
                </View>
                <View style={styles.attendanceButtons}>
                  <TouchableOpacity
                    style={[
                      styles.attendanceButton,
                      styles.presentButton,
                      attendance[student.student_id] === 'Present' &&
                        styles.presentButtonActive,
                    ]}
                    onPress={() => toggleAttendance(student.student_id, 'Present')}
                  >
                    <Text
                      style={[
                        styles.attendanceButtonText,
                        attendance[student.student_id] === 'Present' && {
                          color: COLORS.white,
                        },
                      ]}
                    >
                      P
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.attendanceButton,
                      styles.absentButton,
                      attendance[student.student_id] === 'Absent' &&
                        styles.absentButtonActive,
                    ]}
                    onPress={() => toggleAttendance(student.student_id, 'Absent')}
                  >
                    <Text
                      style={[
                        styles.attendanceButtonText,
                        attendance[student.student_id] === 'Absent' && {
                          color: COLORS.white,
                        },
                      ]}
                    >
                      A
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>
              Select a class to start marking attendance
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Submit Button */}
      {selectedClass && students.length > 0 && (
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || Object.keys(attendance).length === 0) &&
                styles.submitButtonDisabled,
            ]}
            onPress={submitAttendance}
            disabled={submitting || Object.keys(attendance).length === 0}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Attendance</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  compactHeader: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  compactField: {
    flex: 1,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 6,
  },
  compactDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  compactDropdownFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f9ff',
  },
  compactDropdownText: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
  },
  compactDropdownTextFilled: {
    color: COLORS.text,
    fontWeight: '600',
  },
  compactDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 8,
  },
  compactDateText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  statsActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  compactStats: {
    flexDirection: 'row',
    gap: 16,
  },
  compactStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  compactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  compactActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownBox: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  search: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
  },
  dropdownList: {
    maxHeight: 280,
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
  optionText: {
    color: COLORS.text,
    fontSize: 15,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkmark: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentListContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  studentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
  },
  studentRoll: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attendanceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  presentButton: {
    backgroundColor: COLORS.white,
    borderColor: '#10b981',
  },
  presentButtonActive: {
    backgroundColor: '#10b981',
  },
  absentButton: {
    backgroundColor: COLORS.white,
    borderColor: '#ef4444',
  },
  absentButtonActive: {
    backgroundColor: '#ef4444',
  },
  attendanceButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  submitContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 12,
  },
})

export default AttendanceScreen;