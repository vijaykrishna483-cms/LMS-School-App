import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { COLORS } from '../constants/colors';

const BASE_URL = 'https://lms-school-app.onrender.com/api/v1';

const ViewGradesScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rankList, setRankList] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading] = useState(false);

  // Search and Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');

  // Create Exam Modal States
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamMaxMarks, setNewExamMaxMarks] = useState('');
  const [newExamGradeScale, setNewExamGradeScale] = useState('');
  const [creatingExam, setCreatingExam] = useState(false);

  // Create Subject Modal States
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [creatingSubject, setCreatingSubject] = useState(false);

  const getToken = async () => AsyncStorage.getItem('userToken');

  useEffect(() => {
    loadClasses();
  }, []);

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

  const loadExams = async (classId) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/exams/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setExams(json.data || []);
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (classId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/subjects/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setSubjects(json.data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadRankList = async (examId) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/marks/exam/${examId}/ranklist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setRankList(json.data || []);
      setSearchQuery('');
    } catch (error) {
      console.error('Error loading rank list:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create Exam Handler
  const handleCreateExam = async () => {
    if (!newExamName.trim() || !newExamMaxMarks.trim()) {
      Alert.alert('Error', 'Please fill in exam name and max marks');
      return;
    }

    if (!selectedClass) {
      Alert.alert('Error', 'Please select a class first');
      return;
    }

    const maxMarks = parseInt(newExamMaxMarks);
    if (isNaN(maxMarks) || maxMarks <= 0) {
      Alert.alert('Error', 'Max marks must be a positive number');
      return;
    }

    try {
      setCreatingExam(true);
      const token = await getToken();

      const response = await fetch(`${BASE_URL}/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exam_name: newExamName.trim(),
          class_id: selectedClass.class_id,
          max_marks: maxMarks,
          grade_scale: newExamGradeScale.trim() || null,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to create exam');
      }

      Alert.alert('Success', 'Exam created successfully!');
      
      setNewExamName('');
      setNewExamMaxMarks('');
      setNewExamGradeScale('');
      setShowCreateExamModal(false);

      loadExams(selectedClass.class_id);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create exam');
    } finally {
      setCreatingExam(false);
    }
  };

  // Create Subject Handler
  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Error', 'Please enter subject name');
      return;
    }

    if (!selectedClass) {
      Alert.alert('Error', 'Please select a class first');
      return;
    }

    try {
      setCreatingSubject(true);
      const token = await getToken();

      const response = await fetch(`${BASE_URL}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject_name: newSubjectName.trim(),
          class_id: selectedClass.class_id,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to create subject');
      }

      Alert.alert('Success', 'Subject created successfully!');
      
      setNewSubjectName('');
      setShowCreateSubjectModal(false);

      loadSubjects(selectedClass.class_id);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create subject');
    } finally {
      setCreatingSubject(false);
    }
  };

  // Filter and Sort Logic
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...rankList];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.student_name.toLowerCase().includes(query) ||
          item.roll_no.toString().includes(query) ||
          item.total_marks.toString().includes(query)
      );
    }

    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'name') {
        compareValue = a.student_name.localeCompare(b.student_name);
      } else if (sortBy === 'marks') {
        compareValue = a.total_marks - b.total_marks;
      } else {
        const aIndex = rankList.indexOf(a);
        const bIndex = rankList.indexOf(b);
        compareValue = aIndex - bIndex;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [rankList, searchQuery, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getMedalIcon = (rank) => {
    if (rank === 0) return { icon: 'trophy', color: '#f59e0b', bg: '#fef3c7' };
    if (rank === 1) return { icon: 'medal', color: '#9ca3af', bg: '#f3f4f6' };
    if (rank === 2) return { icon: 'medal', color: '#c2410c', bg: '#fed7aa' };
    return null;
  };

  const RankItem = ({ item, index }) => {
    const originalIndex = rankList.indexOf(item);
    const medal = getMedalIcon(originalIndex);

    return (
      <View style={styles.rankCard}>
        <View style={styles.rankBadgeContainer}>
          {medal ? (
            <View style={[styles.medalBadge, { backgroundColor: medal.bg }]}>
              <Ionicons name={medal.icon} size={24} color={medal.color} />
            </View>
          ) : (
            <View style={styles.rankNumberBadge}>
              <Text style={styles.rankNumber}>#{originalIndex + 1}</Text>
            </View>
          )}
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.student_name}</Text>
          <View style={styles.studentMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.metaText}>Roll: {item.roll_no}</Text>
            </View>
          </View>
        </View>

        <View style={styles.marksContainer}>
          <Text style={styles.marksValue}>{item.total_marks}</Text>
          <Text style={styles.marksLabel}>marks</Text>
        </View>

        {item.percentage && (
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>{item.percentage}%</Text>
          </View>
        )}
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="school-outline" size={80} color="#d1d5db" />
      </View>
      <Text style={styles.emptyTitle}>
        {selectedExam
          ? searchQuery
            ? 'No Results Found'
            : 'No Results Available'
          : 'Select Class & Exam'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedExam
          ? searchQuery
            ? 'Try adjusting your search query'
            : 'No grades have been published for this exam yet'
          : 'Choose a class and exam to view student rankings'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="View Grades" showBack onBackPress={() => navigation.goBack()} />

      {/* Compact Selector Section */}
      <View style={styles.selectorSection}>
        {/* Class Selector */}
        <View style={styles.selectorRow}>
          <View style={styles.selectorHeader}>
            <Text style={styles.selectorLabel}>
              <Ionicons name="school-outline" size={16} color={COLORS.primary} /> Class
            </Text>
          </View>
          <FlatList
            data={classes}
            horizontal
            keyExtractor={(i) => i.class_id.toString()}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chip,
                  selectedClass?.class_id === item.class_id && styles.chipActive,
                ]}
                onPress={() => {
                  setSelectedClass(item);
                  setSelectedExam(null);
                  setRankList([]);
                  setSearchQuery('');
                  loadExams(item.class_id);
                  loadSubjects(item.class_id);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedClass?.class_id === item.class_id && styles.chipTextActive,
                  ]}
                >
                  {item.class_name}-{item.section_name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.chipList}
          />
        </View>

        {/* Subjects Section */}
        {selectedClass && (
          <View style={styles.selectorRow}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorLabel}>
                <Ionicons name="book-outline" size={16} color={COLORS.primary} /> Subjects
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateSubjectModal(true)}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                <Text style={styles.createButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipList}
            >
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <View key={subject.subject_id} style={styles.subjectChip}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.subjectChipText}>{subject.subject_name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyExamText}>No subjects yet. Add one!</Text>
              )}
            </ScrollView>
          </View>
        )}

        {/* Exam Selector */}
        {selectedClass && (
          <View style={styles.selectorRow}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorLabel}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.primary} /> Exam
              </Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateExamModal(true)}
              >
                <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={exams}
              horizontal
              keyExtractor={(i) => i.exam_id.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedExam?.exam_id === item.exam_id && styles.chipActive,
                  ]}
                  onPress={() => {
                    setSelectedExam(item);
                    loadRankList(item.exam_id);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedExam?.exam_id === item.exam_id && styles.chipTextActive,
                    ]}
                  >
                    {item.exam_name}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.chipList}
              ListEmptyComponent={
                <Text style={styles.emptyExamText}>No exams yet. Create one!</Text>
              }
            />
          </View>
        )}

        {/* Summary Header */}
        {selectedExam && rankList.length > 0 && (
          <View style={styles.summaryHeader}>
            <View style={styles.summaryItem}>
              <Ionicons name="people" size={20} color={COLORS.primary} />
              <Text style={styles.summaryText}>{rankList.length} Students</Text>
            </View>
            {rankList[0] && (
              <View style={styles.summaryItem}>
                <Ionicons name="trophy" size={20} color="#f59e0b" />
                <Text style={styles.summaryText}>Top: {rankList[0].total_marks} marks</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Search and Sort Section */}
      {selectedExam && rankList.length > 0 && (
        <View style={styles.searchSortSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, roll, or marks..."
              placeholderTextColor={COLORS.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'rank' && styles.sortButtonActive]}
              onPress={() => toggleSort('rank')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'rank' && styles.sortButtonTextActive]}>
                Rank
              </Text>
              {sortBy === 'rank' && (
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={COLORS.white}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
              onPress={() => toggleSort('name')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                Name
              </Text>
              {sortBy === 'name' && (
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={COLORS.white}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'marks' && styles.sortButtonActive]}
              onPress={() => toggleSort('marks')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'marks' && styles.sortButtonTextActive]}>
                Marks
              </Text>
              {sortBy === 'marks' && (
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={COLORS.white}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Rank List */}
      <View style={styles.rankListContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading results...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAndSortedData}
            keyExtractor={(i, idx) => idx.toString()}
            renderItem={RankItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyState />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Create Exam Modal */}
      <Modal
        visible={showCreateExamModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateExamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Exam</Text>
              <TouchableOpacity onPress={() => setShowCreateExamModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.classInfo}>
                <Ionicons name="school" size={20} color={COLORS.primary} />
                <Text style={styles.classInfoText}>
                  Class: {selectedClass?.class_name}-{selectedClass?.section_name}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Exam Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Mid Term, Final Exam"
                  value={newExamName}
                  onChangeText={setNewExamName}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Maximum Marks *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., 100"
                  value={newExamMaxMarks}
                  onChangeText={setNewExamMaxMarks}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Grade Scale (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., A+, A, B+, B..."
                  value={newExamGradeScale}
                  onChangeText={setNewExamGradeScale}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreateExamModal(false);
                    setNewExamName('');
                    setNewExamMaxMarks('');
                    setNewExamGradeScale('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.createButtonFilled}
                  onPress={handleCreateExam}
                  disabled={creatingExam}
                >
                  {creatingExam ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.createButtonFilledText}>Create Exam</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Subject Modal */}
      <Modal
        visible={showCreateSubjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Subject</Text>
              <TouchableOpacity onPress={() => setShowCreateSubjectModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.classInfo}>
                <Ionicons name="school" size={20} color={COLORS.primary} />
                <Text style={styles.classInfoText}>
                  Class: {selectedClass?.class_name}-{selectedClass?.section_name}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g., Mathematics, Physics, English"
                  value={newSubjectName}
                  onChangeText={setNewSubjectName}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreateSubjectModal(false);
                    setNewSubjectName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.createButtonFilled}
                  onPress={handleCreateSubject}
                  disabled={creatingSubject}
                >
                  {creatingSubject ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.createButtonFilledText}>Add Subject</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ViewGradesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  selectorSection: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectorRow: {
    marginBottom: 12,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  chipList: {
    paddingHorizontal: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#10b981',
    marginRight: 10,
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065f46',
  },
  emptyExamText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchSortSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  sortButtonTextActive: {
    color: COLORS.white,
  },
  rankListContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
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

  rankBadgeContainer: {
    marginRight: 12,
  },

  medalBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rankNumberBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  rankNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },

  studentInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },

  studentMeta: {
    flexDirection: 'row',
    gap: 12,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  metaText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  marksContainer: {
    alignItems: 'center',
    marginRight: 8,
  },

  marksValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },

  marksLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
  },

  percentageBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },

  percentageText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textLight,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },

  emptyIconContainer: {
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },

  modalBody: {
    padding: 20,
  },

  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    marginBottom: 20,
  },

  classInfoText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },

  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  createButtonFilled: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },

  createButtonFilledText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
