import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, Alert } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';


export default function App() {
  
  const [modalVisible, setModalVisible] = useState(false);
  

  const [text, setText] = useState('');
  const [text2, setText2] = useState('');
  const [time, setTime] = useState('');
  
  const [items, setItems] = useState([
    { id: 1, name: 'Mathematics', time: '09:00', detail: 'Class 11-A'},
  ]);

  const saveData = () => {
    console.log("save pressed");
    console.log(text, text2, time);

    if(!text || !time){
      Alert.alert("Error", "Please fill data");
      return;
    }

    let newItem = {
      id: Math.random(),
      name: text,
      time: time,
      detail: text2
    };

    let temp = items;
    temp.push(newItem);
    setItems(temp);

    setModalVisible(false);
    setText('');
    setText2('');
    setTime('');
  }

  const deleteItem = (id) => {

    const filtered = items.filter(item => item.id !== id);
    setItems(filtered);
  }

  return (
    <View style={styles.container}>
      

      <View style={{marginTop: 60, paddingHorizontal: 25, paddingBottom: 30}}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
           <Feather name="grid" size={24} color="#D1E0DE" onPress={()=> console.log('menu')} />
           <Text style={{color:'#eee'}}>Dec 6, Fri</Text>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, alignItems: 'center'}}>
          <View>
            <Text style={{fontSize: 18, color: '#D1E0DE'}}>Hello,</Text>
            <Text style={{fontSize: 32, fontWeight: 'bold', color: 'white'}}>Name</Text>
          </View>

          <View style={styles.profileBox}>
            <Ionicons name="person-outline" size={28} color="#D1E0DE" />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        

        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20}}>
          <View style={styles.card}>
             <MaterialCommunityIcons name="file-document-edit-outline" size={26} color="#385F58" />
             <Text style={styles.cardText}>Manage{'\n'}Attendance</Text>
             <Feather name="arrow-right" size={20} style={{alignSelf: 'flex-end', marginTop: 10}}/>
          </View>

          <View style={styles.card}>
             <Ionicons name="school-outline" size={26} color="#385F58" />
             <Text style={styles.cardText}>View{'\n'}Grades</Text>
             <Feather name="arrow-right" size={20} style={{alignSelf: 'flex-end', marginTop: 10}}/>
          </View>
        </View>

        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 10}}>
          <Text style={{fontWeight:'bold', letterSpacing: 0.5}}>LATEST NOTIFICATIONS</Text>
          <Text style={{color:'gray', fontSize: 12}}>See All</Text>
        </View>

        <View style={{backgroundColor: '#F0F2F2', height: 50, borderRadius: 10, marginBottom: 10}}></View>
        <View style={{backgroundColor: '#F0F2F2', height: 50, borderRadius: 10, marginBottom: 25}}></View>

        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
          <Text style={{fontWeight:'bold'}}>TODAY'S CLASSES</Text>
          <TouchableOpacity onPress={()=> setModalVisible(true)}>
            <Feather name="plus-circle" size={26} color="#385F58" />
          </TouchableOpacity>
        </View>

        {items.map((item, index) => {
          return (
            <View style={styles.listItem} key={index}>
               <View style={{width: 50, alignItems: 'center'}}>
                 <Text style={{fontWeight: 'bold', fontSize: 15}}>{item.time}</Text>
                 <Text style={{fontSize: 11, color: '#888'}}>AM</Text>
               </View>
               
               <View style={{width: 1, backgroundColor: '#eee', height: '100%', marginHorizontal: 15}}></View>

               <View style={{flex: 1}}>
                 <Text style={{fontSize: 16, color: '#333'}}>{item.name}</Text>
                 <Text style={{fontSize: 13, color: '#777'}}>{item.detail}</Text>
               </View>

               <TouchableOpacity onPress={() => deleteItem(item.id)}>
                 <Feather name="trash-2" size={18} color="#ff4444" />
               </TouchableOpacity>
            </View>
          )
        })}
        
        <View style={{height: 50}} /> 

      </ScrollView>


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Add New Class</Text>
            
            <Text style={{alignSelf:'flex-start', marginBottom: 5, color: '#555'}}>Subject</Text>
            <TextInput 
              style={styles.input} 
              onChangeText={setText}
              value={text}
              placeholder="Ex: Physics"
            />

            <Text style={{alignSelf:'flex-start', marginBottom: 5, color: '#555'}}>Class/Grade</Text>
            <TextInput 
              style={styles.input} 
              onChangeText={setText2}
              value={text2}
              placeholder="Ex: 12-B"
            />

            <Text style={{alignSelf:'flex-start', marginBottom: 5, color: '#555'}}>Time</Text>
            <TextInput 
              style={styles.input} 
              onChangeText={setTime}
              value={time}
              placeholder="00:00"
              keyboardType='numeric'
            />

            <View style={{flexDirection: 'row', marginTop: 10, width: '100%', justifyContent: 'space-between'}}>
               <TouchableOpacity 
                style={{backgroundColor: '#ddd', flex: 1, padding: 12, borderRadius: 8, marginRight: 5, alignItems:'center'}}
                onPress={() => setModalVisible(false)}>
                 <Text>Cancel</Text>
               </TouchableOpacity>
               
               <TouchableOpacity 
                style={{backgroundColor: '#385F58', flex: 1, padding: 12, borderRadius: 8, marginLeft: 5, alignItems:'center'}}
                onPress={saveData}>
                 <Text style={{color: 'white', fontWeight: 'bold'}}>Save</Text>
               </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#385F58',
  },
  profileBox: {
    width: 55,
    height: 55,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  content: {
    backgroundColor: '#fff',
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25
  },
  card: {
    backgroundColor: '#FBECE6',
    width: '48%',
    height: 120,
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between'
  },
  cardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222'
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.10,
    shadowRadius: 2.41,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: '#eee'
  },
  
  // Modal styles
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    width: '85%',
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 20,
    fontWeight: 'bold'
  }
});