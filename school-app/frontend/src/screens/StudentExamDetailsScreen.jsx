import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { COLORS } from '../constants/colors';

const BASE_URL = 'https://lms-school-app.onrender.com/api/v1';

const StudentExamDetailsScreen = ({ navigation, route }) => {
  const { examId, examName } = route.params || {};
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);

  const getToken = async () => AsyncStorage.getItem('userToken');

  useEffect(() => {
    if (examId) {
      loadMarks();
    } else {
      console.error('No examId provided');
    }
  }, [examId]);

  const loadMarks = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      if (!examId) {
        console.error('No exam ID available');
        setLoading(false);
        return;
      }

      console.log('Fetching marks for exam:', examId);
      
      // Get marks for this specific exam (student endpoint)
      const res = await fetch(`${BASE_URL}/marks/exam/${examId}/my-marks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const json = await res.json();
      console.log('Marks response:', json);
      
      setMarks(json.data || []);
    } catch (error) {
      console.error('Error loading marks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (marks.length === 0) return { total: 0, maxTotal: 0, percentage: 0, grade: '-' };

    const total = marks.reduce((sum, m) => sum + parseFloat(m.marks_scored || 0), 0);
    const maxTotal = marks.reduce((sum, m) => sum + parseFloat(m.max_marks || 0), 0);
    const percentage = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(2) : 0;

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    return { total, maxTotal, percentage, grade };
  };

  const stats = calculateStats();

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return '#10b981';
    if (grade === 'B') return '#3b82f6';
    if (grade === 'C') return '#f59e0b';
    return '#ef4444';
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const renderSubjectMark = (item, index) => {
    const percentage = item.max_marks > 0 
      ? ((item.marks_scored / item.max_marks) * 100).toFixed(1) 
      : 0;
    const color = getPercentageColor(percentage);

    return (
      <View key={index} style={styles.subjectCard}>
        <View style={styles.subjectHeader}>
          <Text style={styles.subjectName}>{item.subject_name}</Text>
          <View style={[styles.percentageBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.percentageText, { color }]}>
              {percentage}%
            </Text>
          </View>
        </View>
        
        <View style={styles.marksRow}>
          <View style={styles.markItem}>
            <Text style={styles.markLabel}>Scored</Text>
            <Text style={styles.markValue}>{item.marks_scored}</Text>
          </View>
          <View style={styles.markDivider} />
          <View style={styles.markItem}>
            <Text style={styles.markLabel}>Max Marks</Text>
            <Text style={styles.markValue}>{item.max_marks}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title={examName || 'Exam Details'} showBack onBackPress={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overall Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Overall Performance</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Marks</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.maxTotal}</Text>
                <Text style={styles.statLabel}>Max Marks</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: getPercentageColor(stats.percentage) }]}>
                  {stats.percentage}%
                </Text>
                <Text style={styles.statLabel}>Percentage</Text>
              </View>
              
              <View style={styles.statBox}>
                <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(stats.grade) }]}>
                  <Text style={styles.gradeText}>{stats.grade}</Text>
                </View>
                <Text style={styles.statLabel}>Grade</Text>
              </View>
            </View>
          </View>

          {/* Subject-wise Marks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
            {marks.length > 0 ? (
              marks.map((item, index) => renderSubjectMark(item, index))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={48} color="#e5e7eb" />
                <Text style={styles.emptyText}>No marks available</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default StudentExamDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  gradeBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  subjectCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  marksRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markItem: {
    flex: 1,
    alignItems: 'center',
  },
  markLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  markValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  markDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 12,
  },
});