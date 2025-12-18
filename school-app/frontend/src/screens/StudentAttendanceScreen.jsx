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

const StudentAttendanceScreen = ({ navigation }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const getToken = async () => AsyncStorage.getItem('userToken');

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/attendance/my-attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setAttendanceData(json.data || {});
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'Present' ? '#10b981' : '#ef4444';
  };

  const getStatusIcon = (status) => {
    return status === 'Present' ? 'checkmark-circle' : 'close-circle';
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 85) return '#10b981';
    if (percentage >= 75) return '#3b82f6';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const stats = attendanceData?.statistics || {
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0,
  };

  const records = attendanceData?.records || [];

  return (
    <View style={styles.container}>
      <Header title="My Attendance" showBack onBackPress={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.percentageCircle}>
              <Text style={[styles.percentageValue, { color: getPercentageColor(stats.percentage) }]}>
                {stats.percentage}%
              </Text>
              <Text style={styles.percentageLabel}>Attendance</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{stats.present}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </View>
                <Text style={styles.statValue}>{stats.absent}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="calendar" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Days</Text>
              </View>
            </View>
          </View>

          {/* Attendance Records */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attendance History</Text>
            
            {records.length > 0 ? (
              records.map((record, index) => (
                <View key={index} style={styles.recordCard}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(record.status) }
                  ]} />
                  
                  <View style={styles.recordContent}>
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordDate}>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(record.status) + '20' }
                      ]}>
                        <Ionicons
                          name={getStatusIcon(record.status)}
                          size={16}
                          color={getStatusColor(record.status)}
                        />
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(record.status) }
                        ]}>
                          {record.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#e5e7eb" />
                <Text style={styles.emptyTitle}>No attendance records</Text>
                <Text style={styles.emptySubtitle}>
                  Your attendance will be tracked here
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default StudentAttendanceScreen;

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
  percentageCircle: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  percentageValue: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 4,
  },
  percentageLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
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
  recordCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusIndicator: {
    width: 4,
  },
  recordContent: {
    flex: 1,
    padding: 16,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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