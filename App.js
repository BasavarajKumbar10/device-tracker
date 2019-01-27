import React, {Component} from 'react';
import {AppRegistry, Text, View} from 'react-native';
import {StackNavigator} from 'react-navigation';
import Dashboard from './app/screens/Dashboard';
import Return from './app/screens/Return';
import AddTrack from './app/screens/AddTrack';
import History from './app/screens/History';



export default class DeviceTracker extends Component {
  static navigationOptions = {  
    title: 'Dashboard',
    headerStyle: {
        backgroundColor: '#FF9800'
    },
    headerTitleStyle: {
        color: '#000000'
    }
}

  render(){
    return <RootStack />
  }
}  

const RootStack = StackNavigator(
  {
    Dashboard: {
      screen: Dashboard
    }, 
    Return: {
      screen: Return
    },
    AddTrack: {
      screen: AddTrack
    },
    History: {
      screen: History
    }
  },
  {
    initialRouteName: 'Dashboard',
  }
)
AppRegistry.registerComponent('DeviceTracker', () => DeviceTracker);
