import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { COLORS } from '../constants/colors';

const BASE_URL = 'https://lms-school-app.onrender.com/api/v1';

const StudentGradesScreen = ({ navigation }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentClass, setStudentClass] = useState(null);

  const getToken = async () => AsyncStorage.getItem('userToken');

  useEffect(() => {
    loadStudentClass();
  }, []);

  const loadStudentClass = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      // First get current user to find their class
      const userRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      
      if (userData.data?.class_id) {
        setStudentClass(userData.data);
        loadExams(userData.data.class_id);
      }
    } catch (error) {
      console.error('Error loading student class:', error);
    }
  };

  const loadExams = async (classId) => {
    try {
      const token = await getToken();
      console.log('Fetching exams for class:', classId);
      
      const res = await fetch(`${BASE_URL}/exams/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      console.log('Exams response:', json);
      
      setExams(json.data || []);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewExamDetails = (exam) => {
    console.log('Navigating with exam:', exam); // Debug log
    navigation.navigate('StudentExamDetails', {
      examId: exam.exam_id,
      examName: exam.exam_name,
      maxMarks: exam.max_marks,
    });
  };

  const renderExam = ({ item, index }) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const color = colors[index % colors.length];

    return (
      <TouchableOpacity
        style={styles.examCard}
        onPress={() => viewExamDetails(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.examIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name="document-text" size={24} color={color} />
        </View>
        
        <View style={styles.examInfo}>
          <Text style={styles.examName}>{item.exam_name}</Text>
          <View style={styles.examMeta}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
            <Text style={styles.examDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#e5e7eb" />
      <Text style={styles.emptyTitle}>No exams yet</Text>
      <Text style={styles.emptySubtitle}>
        Your exam results will appear here once published
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="My Grades" showBack onBackPress={() => navigation.goBack()} />

      <View style={styles.content}>
        {studentClass && (
          <View style={styles.classInfo}>
            <Ionicons name="school" size={20} color={COLORS.primary} />
            <Text style={styles.classText}>
              Class {studentClass.class_name} - {studentClass.section_name}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={exams}
            keyExtractor={(item) => item.exam_id.toString()}
            renderItem={renderExam}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState />}
          />
        )}
      </View>
    </View>
  );
};

export default StudentGradesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
  },
  classText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 16,
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  examIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  examInfo: {
    flex: 1,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  examMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  examDate: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});