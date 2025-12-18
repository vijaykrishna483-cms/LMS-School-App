import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import Header from '../components/Header';
import { authAPI } from '../services/api';

const BASE_URL = 'https://lms-school-app.onrender.com/api/v1';

const NotificationsScreen = ({ navigation }) => {
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Teacher states
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [announcementContent, setAnnouncementContent] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [searchClass, setSearchClass] = useState('');

  // Student states
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [leaveContent, setLeaveContent] = useState('');
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [searchTeacher, setSearchTeacher] = useState('');

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      loadData();
      if (userRole === 'teacher') {
        loadClasses();
      } else {
        loadTeachers();
      }
    }
  }, [userRole, activeTab]);

  const loadUserRole = async () => {
    try {
      const profileData = await authAPI.getCurrentUser();
      setUserRole(profileData.role);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const getToken = async () => AsyncStorage.getItem('userToken');

  const loadClasses = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      setClasses(json.data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      setTeachers(json.data || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      if (activeTab === 'announcements') {
        const endpoint = userRole === 'teacher' 
          ? '/notifications/my-announcements'
          : '/notifications/announcements';
        
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        setAnnouncements(json.data || []);
      } else {
        const endpoint = userRole === 'teacher'
          ? '/notifications/leave-requests'
          : '/notifications/my-leave-requests';
        
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await response.json();
        setLeaveRequests(json.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    if (!selectedClass || !announcementContent.trim()) {
      Alert.alert('Error', 'Please select a class and enter announcement content');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/notifications/announcement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: announcementContent,
          target_class_id: selectedClass.class_id,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Announcement sent successfully');
        setShowCreateModal(false);
        setAnnouncementContent('');
        setSelectedClass(null);
        loadData();
      } else {
        Alert.alert('Error', 'Failed to send announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to send announcement');
    }
  };

  const createLeaveRequest = async () => {
    if (!selectedTeacher || !leaveContent.trim()) {
      Alert.alert('Error', 'Please select a teacher and enter leave reason');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/notifications/leave-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: leaveContent,
          target_teacher_id: selectedTeacher.teacher_id,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Leave request submitted successfully');
        setShowCreateModal(false);
        setLeaveContent('');
        setSelectedTeacher(null);
        loadData();
      } else {
        Alert.alert('Error', 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error creating leave request:', error);
      Alert.alert('Error', 'Failed to submit leave request');
    }
  };

  const updateLeaveRequestStatus = async (requestId, status) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${BASE_URL}/notifications/leave-request/${requestId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        Alert.alert('Success', `Leave request ${status.toLowerCase()}`);
        loadData();
      } else {
        Alert.alert('Error', 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const deleteAnnouncement = async (notificationId) => {
    Alert.alert('Delete Announcement', 'Are you sure you want to delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken();
            await fetch(`${BASE_URL}/notifications/${notificationId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Success', 'Announcement deleted');
            loadData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete announcement');
          }
        },
      },
    ]);
  };

  const renderTeacherAnnouncement = (item) => (
    <View key={item.notification_id} style={styles.notificationCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: '#dbeafe' }]}>
          <Ionicons name="megaphone-outline" size={24} color="#3b82f6" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.className}>
            Class {item.class_name}-{item.section_name}
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteAnnouncement(item.notification_id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.contentText}>{item.content}</Text>
    </View>
  );

  const renderStudentAnnouncement = (item) => (
    <View key={item.notification_id} style={styles.notificationCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: '#dbeafe' }]}>
          <Ionicons name="megaphone-outline" size={24} color="#3b82f6" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.teacherName}>
            {item.teacher_name || 'Teacher'}
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.announcementBadge}>
          <Ionicons name="school-outline" size={16} color="#3b82f6" />
          <Text style={styles.announcementBadgeText}>Announcement</Text>
        </View>
      </View>
      <Text style={styles.contentText}>{item.content}</Text>
    </View>
  );

  const renderLeaveRequest = (item) => {
    const statusColors = {
      PENDING: { bg: '#fef3c7', text: '#f59e0b', icon: 'time-outline' },
      APPROVED: { bg: '#dcfce7', text: '#10b981', icon: 'checkmark-circle-outline' },
      REJECTED: { bg: '#fee2e2', text: '#ef4444', icon: 'close-circle-outline' },
    };

    const status = statusColors[item.status] || statusColors.PENDING;
    const isTeacher = userRole === 'teacher';

    return (
      <View key={item.notification_id} style={styles.leaveCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, { backgroundColor: '#f0f9ff' }]}>
            <Ionicons name="document-text-outline" size={24} color="#3b82f6" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.studentName}>
              {isTeacher ? item.student_name : `To: ${item.teacher_name || 'Teacher'}`}
            </Text>
            {isTeacher && (
              <Text style={styles.studentDetails}>
                Roll No: {item.roll_no} • Class {item.class_name}-{item.section_name}
              </Text>
            )}
            {!isTeacher && (
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={16} color={status.text} />
            <Text style={[styles.statusText, { color: status.text }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.contentText}>{item.content}</Text>

        {isTeacher && (
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}

        {!isTeacher && (
          <>
            {item.status === 'APPROVED' && (
              <View style={styles.statusMessage}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={[styles.statusMessageText, { color: '#10b981' }]}>
                  Your leave request has been approved
                </Text>
              </View>
            )}

            {item.status === 'REJECTED' && (
              <View style={styles.statusMessage}>
                <Ionicons name="close-circle" size={18} color="#ef4444" />
                <Text style={[styles.statusMessageText, { color: '#ef4444' }]}>
                  Your leave request was not approved
                </Text>
              </View>
            )}

            {item.status === 'PENDING' && (
              <View style={styles.statusMessage}>
                <Ionicons name="time" size={18} color="#f59e0b" />
                <Text style={[styles.statusMessageText, { color: '#f59e0b' }]}>
                  Waiting for teacher's response
                </Text>
              </View>
            )}
          </>
        )}

        {isTeacher && item.status === 'PENDING' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#dcfce7' }]}
              onPress={() => updateLeaveRequestStatus(item.notification_id, 'APPROVED')}
            >
              <Ionicons name="checkmark" size={20} color="#10b981" />
              <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
              onPress={() => updateLeaveRequestStatus(item.notification_id, 'REJECTED')}
            >
              <Ionicons name="close" size={20} color="#ef4444" />
              <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const DropdownItem = ({ label, onPress, isSelected }) => (
    <TouchableOpacity
      style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.dropdownOptionText, isSelected && styles.dropdownOptionTextSelected]}>
        {label}
      </Text>
      {isSelected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
    </TouchableOpacity>
  );

  if (!userRole) {
    return (
      <View style={styles.container}>
        <Header title="Notifications" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  const isTeacher = userRole === 'teacher';
  const tabLabel = isTeacher ? 'Leave Requests' : 'My Leave Requests';

  return (
    <View style={styles.container}>
      <Header title="Notifications" showBack onBackPress={() => navigation.goBack()} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
          onPress={() => setActiveTab('announcements')}
        >
          <Ionicons
            name="megaphone-outline"
            size={20}
            color={activeTab === 'announcements' ? COLORS.primary : COLORS.textLight}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'announcements' && styles.activeTabText,
            ]}
          >
            Announcements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'leave-requests' && styles.activeTab]}
          onPress={() => setActiveTab('leave-requests')}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={activeTab === 'leave-requests' ? COLORS.primary : COLORS.textLight}
          />
          <Text
            style={[styles.tabText, activeTab === 'leave-requests' && styles.activeTabText]}
          >
            {tabLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Create Button */}
      {((activeTab === 'announcements' && isTeacher) || 
        (activeTab === 'leave-requests' && !isTeacher)) && (
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={styles.createButtonText}>
              {isTeacher ? 'Send Announcement' : 'Request Leave'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : activeTab === 'announcements' ? (
          announcements.length > 0 ? (
            announcements.map(item => 
              isTeacher ? renderTeacherAnnouncement(item) : renderStudentAnnouncement(item)
            )
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Announcements</Text>
              <Text style={styles.emptySubtitle}>
                {isTeacher 
                  ? "You haven't sent any announcements yet"
                  : "No announcements from your teachers yet"}
              </Text>
            </View>
          )
        ) : leaveRequests.length > 0 ? (
          leaveRequests.map(renderLeaveRequest)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Leave Requests</Text>
            <Text style={styles.emptySubtitle}>
              {isTeacher
                ? "No students have submitted leave requests"
                : "You haven't submitted any leave requests yet"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isTeacher ? 'Send Announcement' : 'Request Leave'}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {isTeacher ? (
              <>
                {/* Class Selection */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Select Class</Text>
                  <TouchableOpacity
                    style={[styles.dropdown, selectedClass && styles.dropdownFilled]}
                    onPress={() => setShowClassDropdown(!showClassDropdown)}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        selectedClass && styles.dropdownTextFilled,
                      ]}
                    >
                      {selectedClass
                        ? `Class ${selectedClass.class_name}-${selectedClass.section_name}`
                        : 'Choose class'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
                  </TouchableOpacity>

                  {showClassDropdown && (
                    <View style={styles.dropdownBox}>
                      <TextInput
                        placeholder="Search class..."
                        value={searchClass}
                        onChangeText={setSearchClass}
                        style={styles.searchInput}
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
                              setShowClassDropdown(false);
                              setSearchClass('');
                            }}
                          />
                        )}
                        style={styles.dropdownList}
                      />
                    </View>
                  )}
                </View>

                {/* Announcement Content */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Announcement Message</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Type your announcement here..."
                    placeholderTextColor="#9ca3af"
                    value={announcementContent}
                    onChangeText={setAnnouncementContent}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                {/* Send Button */}
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!selectedClass || !announcementContent.trim()) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={createAnnouncement}
                  disabled={!selectedClass || !announcementContent.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Send Announcement</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Teacher Selection */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Select Teacher</Text>
                  <TouchableOpacity
                    style={[styles.dropdown, selectedTeacher && styles.dropdownFilled]}
                    onPress={() => setShowTeacherDropdown(!showTeacherDropdown)}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        selectedTeacher && styles.dropdownTextFilled,
                      ]}
                    >
                      {selectedTeacher
                        ? selectedTeacher.full_name
                        : 'Choose teacher'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
                  </TouchableOpacity>

                  {showTeacherDropdown && (
                    <View style={styles.dropdownBox}>
                      <TextInput
                        placeholder="Search teacher..."
                        value={searchTeacher}
                        onChangeText={setSearchTeacher}
                        style={styles.searchInput}
                        placeholderTextColor="#9ca3af"
                      />
                      <FlatList
                        data={teachers.filter((t) =>
                          t.full_name
                            .toLowerCase()
                            .includes(searchTeacher.toLowerCase())
                        )}
                        keyExtractor={(i) => i.teacher_id.toString()}
                        renderItem={({ item }) => (
                          <DropdownItem
                            label={item.full_name}
                            isSelected={selectedTeacher?.teacher_id === item.teacher_id}
                            onPress={() => {
                              setSelectedTeacher(item);
                              setShowTeacherDropdown(false);
                              setSearchTeacher('');
                            }}
                          />
                        )}
                        style={styles.dropdownList}
                      />
                    </View>
                  )}
                </View>

                {/* Leave Reason */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Reason for Leave</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Explain your reason for requesting leave..."
                    placeholderTextColor="#9ca3af"
                    value={leaveContent}
                    onChangeText={setLeaveContent}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!selectedTeacher || !leaveContent.trim()) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={createLeaveRequest}
                  disabled={!selectedTeacher || !leaveContent.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Submit Request</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 4,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    backgroundColor: COLORS.background,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  leaveCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  studentDetails: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  announcementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    gap: 4,
  },
  announcementBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
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
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 8,
  },
  contentText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusMessageText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: COLORS.background,
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
  dropdownText: {
    color: '#9ca3af',
    fontSize: 15,
    flex: 1,
  },
  dropdownTextFilled: {
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  searchInput: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
  },
  dropdownList: {
    maxHeight: 150,
  },
  dropdownOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  dropdownOptionText: {
    color: COLORS.text,
    fontSize: 15,
  },
  dropdownOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 120,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default NotificationsScreen;