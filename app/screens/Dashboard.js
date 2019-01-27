'use strict'
import React, {Component} from 'react';
import {AppRegistry, View, TouchableHighlight, 
        ListView, StyleSheet} from 'react-native';
import { 
    Container, Content, Button, 
    Text, Fab, Spinner,
    Picker, Icon, Badge } from 'native-base';
import IconFontAwesome from 'react-native-vector-icons/FontAwesome';
import IconFoundation from 'react-native-vector-icons/Foundation';
import firebase from 'firebase';

const firebaseConfig = {
     //This need your firebase configs, which are the part of google-json
     apiKey: "<api key>",
     authDomain: "<auth domain ex: devicetracker.firebaseapp.com>",
     databaseURL: "<real-time database base url ex: https://devicetracker.firebaseio.com>",
     projectId: "<ex:devicetracker>",
     storageBucket: "<ex: devicetracker.appspot.com>",
     messagingSenderId: "<messaging id>"
}

const firebaseApp = firebase.initializeApp(firebaseConfig);
const filterValues = ["All", "Available","Taken"];
var filterView;
export default class Dashboard extends Component{
    constructor() {
        super();
        console.log("in constr");  
        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            devicesDataSource: ds,
            allDeviceData: undefined,
            isLoading: true,
            active: false,
            filterBy: filterValues[0],
            badgeCount: 0 
        };
      }
    

    static navigationOptions = {  
        title: 'Dashboard',
        headerStyle: {
            backgroundColor: '#FF9800'
        },
        headerTitleStyle: {
            color: '#000000'
        }
    }

    componentDidMount(){
        this.getDevices();
    }

    getDevices(){
        this.setState({
            isLoading: true
        });
        let devices = []; 
        console.log("getDevices");  
        firebaseApp.database().ref('devices').orderByChild('deviceName').on(('value'), (snap) => { 
            snap.forEach((child) => {
                    console.log("Device",child.val().deviceName, "Chile key: ",child.key);
                    devices.push({
                        deviceName: child.val().deviceName,
                        imei: child.val().imei,
                        isAvailable: child.val().isAvailable,
                        trackKey: child.val().trackKey,
                        takenBy: child.val().takenBy,
                        key: child.key
                    });
            });
            console.log('Devices',devices); 
            this.setState({
                devicesDataSource: this.state.devicesDataSource.cloneWithRows(devices),
                isLoading: false,
                badgeCount: devices.length,
                allDeviceData: devices
            }); 
        });
    }


    onItemPress(device){
        console.log("onItemPress: ",device);
        if(device.isAvailable){
            this.props.navigation.navigate('AddTrack',{'firebase':firebaseApp, 'device':device, callReload:this.reload.bind(this)})
        }else{
            this.props.navigation.navigate('Return',{'firebase':firebaseApp, 'device':device, callReload:this.reload.bind(this)})
        }
    }

    renderRow(device, sectionId, rowId, hightlightRow){
        return(
            <TouchableHighlight
                onPress={() => {this.onItemPress(device)}}>
                <View style={styles.card}>
                    <View style={styles.rowDetails}>
                        <Text style={styles.rowDeviceName}>{device.deviceName}</Text>
                        <Text style={styles.rowImei}>IMEI: {device.imei}</Text>
                        <Text style={styles.rowTaken}>{device.takenBy}</Text>
                    </View>  
                    <View style={styles.rowStatus}>                  
                        {device.isAvailable? 
                            <Button bordered small success disabled='true' style={{width: 120, justifyContent: 'center'}}>
                            <Text>Available</Text>
                        </Button>:
                        <Button bordered small danger disabled='true' style={{width: 120, justifyContent: 'center'}}>
                        <Text>Taken</Text>
                    </Button>}
                    </View>
                </View>
            </TouchableHighlight>
                
        )
    }  

    reload(){
        this.getDevices();
        this.onFilterSelection(this.state.filterBy);
    }

    onAdd(){
        console.log('on Add');
        this.setState({ 
            active: !this.state.active 
        });
        this.props.navigation.navigate('AddTrack', {'firebase': firebaseApp, callReload:this.reload.bind(this)})
    }

    onHistory(){
        console.log('on History');
        this.setState({ 
            active: !this.state.active 
        });
        this.props.navigation.navigate('History', {'firebase': firebaseApp,'devices': this.state.allDeviceData})
    }

    onFilterSelection(value: string) {
        console.log("Prev filter: ", this.state.filterBy)
       console.log("Selected filter: ",value);
        var available = (value == filterValues[1]? true: false);
        console.log("available: ",available);
        var devices = [];

        if(value != filterValues[0]){
            for(var i=0; i< this.state.allDeviceData.length; i++){
                var device = this.state.allDeviceData[i];
                console.log("is available: ",device.isAvailable,"device",device.deviceName);
                if(device.isAvailable == available){
                    devices.push(device);
                }
            }
        }else{
            devices = this.state.allDeviceData;
        }   

        console.log("filtered devices: ",devices);
            this.setState({
                devicesDataSource: this.state.devicesDataSource.cloneWithRows(devices),
                filterBy: value,
                badgeCount: devices.length
            });
    }

    filters(){
        //to bind user data
        const filterItems = []; 
        for (var i = 0; i < filterValues.length; i++) {
            var s = filterValues[i]; 
            filterItems.push(<Picker.Item key={i+1} value={s} label={s} />); 
        }

        filterView = <Picker 
                    iosHeader="Filter"
                    mode="dropdown"
                    iosIcon={<Icon name="ios-arrow-down-outline" />}
                    placeholder={this.state.filterBy}
                    placeholderStyle={{ color: "#bfc6ea" }}
                    placeholderIconColor="#007aff"
                    style={styles.dropDownStyle}
                    selectedValue={this.state.filterBy}
                    onValueChange={this.onFilterSelection.bind(this)}>         
                    {
                        filterItems
                    }
                </Picker>
    }

    render(){
        //to bind user data
        this.filters();

        console.log('Dashboard:: render');
        var dataView;
        if(typeof this.state.devicesDataSource == 'undefined' || 
            this.state.devicesDataSource.getRowCount() == 0){
                dataView = <View style={styles.noDataView}>
                                <Text style={styles.noDataText}>No devices to show.</Text>
                            </View>;
        }else{
            dataView =  <ListView 
                dataSource={this.state.devicesDataSource}
                renderRow={this.renderRow.bind(this)}/>;
        }

        var currentView = this.state.isLoading? <Spinner color='red' /> : 
                            dataView;
        console.log("data: ",this.state.devicesDataSource.getRowCount());
        return(   
            <Container>
               <Content style={styles.main}> 
               <View style={styles.filterView}>
                   {/*  <IconFontAwesome name="filter" /> */}
                    {filterView}
                    <Badge info style={styles.badgeStyle}>
                        <Text>{this.state.badgeCount}</Text>
                    </Badge>
                </View>
                    {currentView}
                </Content>
                <View>
                    <Fab
                        active={this.state.active}
                        direction="up"
                        containerStyle={{ }}
                        style={{ backgroundColor: '#90A4AE' }}
                        position="bottomRight"
                        onPress={() => this.setState({ active: !this.state.active })}>
                        <IconFontAwesome name="expand" />
                            <Button style={{ backgroundColor: '#4CAF50' }}
                                onPress={this.onAdd.bind(this)}>
                                <IconFontAwesome name="plus-circle" />
                            </Button>
                            <Button style={{ backgroundColor: '#FF9800' }}
                                onPress={this.onHistory.bind(this)}>
                                <IconFontAwesome name="history" />
                            </Button>
                    </Fab>
                </View>
            </Container>
        );
    }
}

const styles = StyleSheet.create({
    main: {
        backgroundColor: '#EEEEEE',
    },
    card: {
        backgroundColor: '#ffffff',
        marginRight: 14,
        marginLeft: 14,
        marginTop:6,
        marginBottom:6,
        padding:14
    },
    rowDetails: {
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
    rowStatus: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end'
    },
    rowDeviceName: {
        color: '#000000',
        fontSize: 18,
        fontWeight: 'bold'
    },
    rowImei: {
        color: '#000000'
    },
    rowTaken: {
        color: '#9E9E9E',
    },
    filterPicker: {
        width: 100,
        alignContent: 'flex-start'
    },
    filterIcon : {
        alignContent: 'flex-end',
    },
    filterView: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent:'center',
    },
    dropDownStyle: {
        flex: 4,
        width: 150, 
        height: 50,
        marginLeft: 14,
    },
    badgeStyle: {
        width: 35,
        height: 35,
        paddingTop: 5, 
        marginRight: 14,
        marginTop: 6
    },
    noDataText: {
        color: '#9E9E9E',
        fontSize: 18,
        fontWeight: 'bold',
    },
    noDataView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop:  0
    }
});


