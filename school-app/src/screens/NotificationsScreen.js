// screens/NotificationsScreen.js

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// --------- SAMPLE DATA ----------

// Newest ones (top section)
const latestNotifications = [
  {
    id: "L1",
    title: "Sick leave request",
    details:
      "Your sick leave request for 7 Feb has been submitted to the class teacher and is awaiting approval.",
  },
  {
    id: "L2",
    title: "Homework uploaded",
    details:
      "Science homework for Chapter 4 has been uploaded in the portal. Please submit by tomorrow.",
  },
];

// Older ones (bottom section)
const olderNotifications = [
  {
    id: "O1",
    title: "PTA meeting reminder",
    details:
      "PTA meeting scheduled on 5 Feb at 10 AM in the school auditorium.",
  },
  {
    id: "O2",
    title: "Exam timetable released",
    details:
      "Final exam timetable has been released. Check the notice board or school app.",
  },
  {
    id: "O3",
    title: "Fee payment reminder",
    details:
      "Kindly pay the term fee before 10 Feb to avoid late charges.",
  },
  {
    id: "O4",
    title: "Sports event registration",
    details:
      "Registrations for the annual sports meet close on 8 Feb.",
  },
];

// ---------------------------------

export default function NotificationsScreen() {
  // Keep track of which card is expanded
  const [expandedId, setExpandedId] = React.useState("L1");

  // ---------- DYNAMIC DATE ----------
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "short", // Mon
    day: "numeric", // 7
    month: "short", // Feb
  });
  // -----------------------------------

  const handleToggle = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  // Helper to render a section (Latest / Older)
  const renderSection = (title, data) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {data.map((item) => {
        const isExpanded = expandedId === item.id;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            onPress={() => handleToggle(item.id)}
            style={[
              styles.card,
              isExpanded && styles.cardExpanded,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#2f6f62"
              />
            </View>

            {isExpanded && (
              <Text style={styles.cardDetails}>{item.details}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Top green header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />

          {/* Dynamic date */}
          <Text style={styles.headerDate}>{dateString}</Text>
        </View>

        <View style={styles.headerBottomRow}>
          <View style={styles.bellCircle}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color="#ffffff"
            />
          </View>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
      </View>

      {/* White rounded body with scrollable content */}
      <View style={styles.bodyContainer}>
        <ScrollView contentContainerStyle={styles.scrollInner}>
          {renderSection("Latest notifications", latestNotifications)}
          {renderSection("Older notifications", olderNotifications)}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  header: {
    backgroundColor: "#216c5a",
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerDate: {
    fontSize: 14,
    color: "#e2f0ec",
    fontWeight: "600",
  },
  headerBottomRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  bellCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 26,
    color: "#ffffff",
    fontWeight: "700",
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  scrollInner: {
    paddingBottom: 24,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#e9f5f3",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
  },
  cardExpanded: {
    backgroundColor: "#cfe5e1",
    paddingVertical: 22,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardDetails: {
    marginTop: 10,
    fontSize: 14,
    color: "#344040",
  },
});
