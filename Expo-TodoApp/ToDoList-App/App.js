import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Switch, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiUrl = "https://pit4-todolist-fastapi.onrender.com";

export default function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedTask, setEditedTask] = useState('');
  const [filter, setFilter] = useState('all');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const loadMode = async () => {
      const savedMode = await AsyncStorage.getItem('darkMode');
      if (savedMode !== null) {
        setDarkMode(savedMode === 'true');
      }
    };
    loadMode();
    fetchTasks();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${apiUrl}/fetch/`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Could not fetch tasks. Please try again later.');
    }
  };

  const removeTask = async (id) => {
    try {
      await axios.delete(`${apiUrl}/${id}/delete/`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Could not delete task. Please try again later.');
    }
  };

  const addTask = async () => {
    if (task.trim() === '') return;
    try {
      await axios.post(`${apiUrl}/create/`, { title: task, completed: false });
      setTask('');
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Could not add task. Please try again later.');
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      const title = tasks.find(t => t.id === id)?.title || '';
      await axios.put(`${apiUrl}/${id}/update/`, { title, completed: !completed });
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task completion:', error);
      Alert.alert('Error', 'Could not update task status. Please try again later.');
    }
  };

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditedTask(tasks[index].title);
  };

  const confirmEdit = async (index) => {
    const updatedTask = tasks[index];
    try {
      await axios.put(`${apiUrl}/${updatedTask.id}/update/`, {
        title: editedTask,
        completed: updatedTask.completed,
      });
      setEditingIndex(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Could not update task. Please try again later.');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  const styles = getStyles(darkMode);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>To-Do List</Text>

      <Switch value={darkMode} onValueChange={() => setDarkMode(!darkMode)} />

      <TextInput
        style={styles.input}
        placeholder="Add a new task..."
        placeholderTextColor={darkMode ? '#ccc' : '#000'}
        value={task}
        onChangeText={setTask}
      />

      <TouchableOpacity style={styles.button} onPress={addTask}>
        <Text style={styles.buttonText}>Add Task</Text>
      </TouchableOpacity>

      <View style={styles.filterContainer}>
        {['all', 'completed', 'pending'].map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.filterButton, filter === type && styles.activeFilter]}
            onPress={() => setFilter(type)}
          >
            <Text style={styles.buttonText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleComplete(item.id, item.completed)} style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
              {item.completed && <Text style={styles.checkboxText}>✓</Text>}
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 10 }}>
              {editingIndex === index ? (
                <TextInput style={styles.input} value={editedTask} onChangeText={setEditedTask} />
              ) : (
                <Text style={[styles.taskText, item.completed && styles.completed]}>{item.title}</Text>
              )}
            </View>

            <View style={styles.taskActions}>
              {editingIndex === index ? (
                <TouchableOpacity onPress={() => confirmEdit(index)} style={styles.actionButton}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => startEditing(index)} style={styles.actionButton}>
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => removeTask(item.id)} style={[styles.actionButton, styles.deleteButton]}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function getStyles(darkMode) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? '#222' : '#eae0c8',
      alignItems: 'center',
      paddingTop: 50,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: darkMode ? '#fff' : '#000',
      marginBottom: 10,
    },
    input: {
      width: '100%',
      padding: 12,
      marginVertical: 10,
      backgroundColor: darkMode ? '#6F4E37' : '#b08968',
      color: darkMode ? '#fff' : '#000',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: darkMode ? '#888' : '#444',
    },
    button: {
      backgroundColor: '#b08968',
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 10,
    },
    filterButton: {
      backgroundColor: '#6F4E37',
      padding: 8,
      borderRadius: 8,
    },
    activeFilter: {
      backgroundColor: '#f4e3d7',
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: darkMode ? '#333' : '#f4e3d7',
      borderRadius: 8,
      padding: 10,
      marginVertical: 5,
      borderWidth: 1.5,
      borderColor: darkMode ? '#aaa' : '#6F4E37',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: darkMode ? '#ccc' : '#333',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: darkMode ? '#444' : '#fff',
    },
    checkboxChecked: {
      backgroundColor: '#6F4E37',
      borderColor: '#6F4E37',
    },
    checkboxText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    taskText: {
      fontSize: 14,
      color: darkMode ? '#fff' : '#000',
    },
    completed: {
      textDecorationLine: 'line-through',
    },
    taskActions: {
      flexDirection: 'row',
      gap: 10,
    },
    actionButton: {
      backgroundColor: '#6F4E37',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginLeft: 5,
    },
    deleteButton: {
      backgroundColor: '#8B0000',
    },
  });
}
