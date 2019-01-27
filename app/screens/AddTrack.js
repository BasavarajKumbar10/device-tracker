'use strict'
import React, {Component} from 'react';
import {AppRegistry, View, Alert, 
        StyleSheet, TouchableHighlight, Image, Platform} from 'react-native';
import { Container, Header, Content, 
        Button, Form, Input, 
        Label, Item, Icon, 
        Text, Textarea, Spinner,
        Toast, Picker } from 'native-base';

const mandatoryFieldsErrorMessage = "All fields are madatory! Please verify.";
const devicePickerPlaceHolder = "Select Device";
const userPickerPlaceHolder = "Select User";

var selectedDevice = undefined;
var otherUservalue = undefined;

export default class AddTrack extends Component{
    constructor(props){
        super(props);
        console.log("is from dashboard",typeof this.props.navigation.state.params.device != 'undefined');
        this.state = {
            firebaseApp: this.props.navigation.state.params.firebase,
            isLoading: true,
            deviceDataSource: [],
            usersDataSource: [],
            deviceName: (typeof this.props.navigation.state.params.device != 'undefined'?
                this.props.navigation.state.params.device.deviceName: undefined),
            selectedDeviceName: undefined,
            imei: (typeof this.props.navigation.state.params.device != 'undefined'?
            this.props.navigation.state.params.device.imei: undefined),
            takenBy: undefined,
            reason: "Application testing",
            key:  (typeof this.props.navigation.state.params.device != 'undefined'?
            this.props.navigation.state.params.device.key: undefined),
            apiCallInProgress: false,
            showOtherUserInput: false,
            otherUser: undefined
        }
    }

    componentDidMount(){
        this.getDevices();
        this.getUsers();
    }

    goBack(){
        this.props.navigation.goBack();
    }

    static navigationOptions = {
        title: 'Entry',
        headerStyle: {
            backgroundColor: '#FF9800'
        },
        headerTitleStyle: {
            color: '#000000'
        }
    }

    onFinishOfApi(){
        this.setState({
            apiCallInProgress: false
        })
    }

    addUserToDB(){
        this.state.firebaseApp.database().ref('users').push().set({
            "name" : otherUservalue
        }).then(() => {
            console.log('INSERTED !');
            this.props.navigation.goBack();
        }).catch((error) => {
            console.log(error);
        });
    }

    onAddPress(){
        console.log('Push to databse');
        console.log('IMEI: ',this.state.imei);
        console.log('Taken by: ',this.state.takenBy);
        console.log('Reason: ',this.state.reason);

        //filter selected device
        this.getSelectedDevice(this.state.imei);
        console.log('Other user flag: ',this.state.showOtherUserInput," Value: ",otherUservalue);

        //Validate fields
        //values should not be same as place holder text
        if(typeof this.state.imei == "undefined" ||  typeof this.state.takenBy == "undefined" 
            || typeof this.state.reason == "undefined" || typeof selectedDevice == "undefined"
            || selectedDevice == devicePickerPlaceHolder || this.state.takenBy == userPickerPlaceHolder
            || (this.state.showOtherUserInput && typeof otherUservalue == "undefined")){

    
            console.log('Missing fields or params');
            //show error toast               
            this.showErrorAlert();
            return;
        }

        this.setState({
            apiCallInProgress: true
        })

        var takenDate = this.getCurrentDate(false);
        //track key to maintain as key wrt to selected device
        var trackKey = selectedDevice.key + "_" + this.getCurrentDate(true) + "_" + new Date().getTime();
        console.log("Current date: ",trackKey);

        //if other user is choosen
        var takenBy = this.state.takenBy;
        if(this.state.showOtherUserInput){
            takenBy = otherUservalue;
            this.addUserToDB();
        }
        var track = {
                "deviceName": selectedDevice.deviceName,
                "selectedDeviceKey": selectedDevice.key,
                "imei": this.state.imei,
                "takenBy": takenBy,
                "reason": this.state.reason,
                "isReturned": false,
                "takenDate": takenDate
        }
        console.log('Check track: ',track);
        this.state.firebaseApp.database().ref('tracks/'+trackKey).set(track).then(() => {
                   console.log('INSERTED !');
                   this.updateDeviceStatus(trackKey, takenBy);
            }).catch((error) => {
                   console.log(error);
                   this.onFinishOfApi();
           });
    }

    updateDeviceStatus(trackKey, takenBy){
        this.state.firebaseApp.database().ref('devices/'+selectedDevice.key).set({
            "deviceName": selectedDevice.deviceName,
            "imei": selectedDevice.imei,
            "isAvailable": false,
            "takenBy" : takenBy,
            "trackKey": trackKey
        }).then(() => {
            this.onFinishOfApi();
            this.props.navigation.state.params.callReload();
            this.props.navigation.goBack();
        }).catch((error) => {
                console.log(error);
                this.onFinishOfApi();
        });
    }

    showErrorAlert(){
            Alert.alert(
                null,
                mandatoryFieldsErrorMessage,
                [
                  {text: 'OK', onPress: () => {console.log('OK Pressed')}}
                ],
                { cancelable: false }
              )
    }

    getSelectedDevice(value){
        var key = undefined;
        for (var i = 0; i < this.state.deviceDataSource.length; i++) {
            var s = this.state.deviceDataSource[i]; 
            if(value == s.imei){
                selectedDevice = s;
                break;
            }
       }
    }

    onChageOfReason(value){
        this.setState({
            reason: value
        });
    }

    getDevices(){
        let devices = []; 
        console.log("getDevices");  
        this.state.firebaseApp.database().ref('devices').orderByChild('deviceName').on(('value'), (snap) => { 
            snap.forEach((child) => {
                if(child.val().isAvailable){
                    devices.push({
                        deviceName: child.val().deviceName,
                        imei: child.val().imei,
                        isReturned: child.val().isAvailable,
                        key: child.key
                    });
                }
            });
            console.log('Devices',devices); 
            this.setState({
                deviceDataSource: devices
            }); 
        });
    }

    getUsers(){
        let users = []; 
        console.log("getUsers");  
        this.state.firebaseApp.database().ref('users').orderByChild('name').on(('value'), (snap) => { 
            snap.forEach((child) => {
                    users.push({
                        name: child.val().name
                    });
            });
            console.log('users',users); 
            this.setState({
                usersDataSource: users,
                isLoading: false
            }); 
        });
    }

    onDeviceSelection(value: string) {
        if(value != devicePickerPlaceHolder){
            this.setState({
                imei: value, 
                deviceName: value
            });  
        }else{
            this.setState({
                imei: undefined,
                deviceName: value
            }); 
        }
    }

    onUserSelection(value: string) {
        if(value != userPickerPlaceHolder){
            this.setState({
                takenBy: value
            });
        }else{
            this.setState({
                takenBy: userPickerPlaceHolder
            }); 
        }

        //for other user selection
        if(value == "Other"){
            this.setState({
                showOtherUserInput: true
            });
        }else{
            otherUservalue = undefined;
            this.setState({
                showOtherUserInput: false,
                otherUser: undefined
            });
        }
    }

    getCurrentDate=(isForKey) =>{
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1;
        var date;
        if(dd<10) 
        {
            dd='0'+dd;
        } 

        if(mm<10) 
        {
            mm='0'+mm;
        } 
        
        if(isForKey){
            date= dd + "" + mm +"" + today.getFullYear();
        }else{
            date= dd + "/"+ mm +"/"+ today.getFullYear();
        }
        console.log("Date formatted: ",date);
        return date;
    }

    onChageOfUser(value: string){
        otherUservalue = value;
    }

    render(){
        console.log('AddTrack:: render');
        console.log('Selected device: ',this.state.deviceName);
        
        if(this.state.isLoading){
            return(
                <Container>
                    <Content padder>
                        <Spinner color='red'/>
                    </Content>
                </Container>
            )
        }

        //to bind device data
        const deviceItems = []; 
        deviceItems.push(<Picker.Item key={0} value={devicePickerPlaceHolder} label={devicePickerPlaceHolder}/>); 
        for (var i = 0; i < this.state.deviceDataSource.length; i++) {
            var s = this.state.deviceDataSource[i]; 
            deviceItems.push(<Picker.Item key={i+1} value={s.imei} label={s.deviceName} />); 
        }

        //to bind user data
        const userItems = []; 
        userItems.push(<Picker.Item key={0} value={userPickerPlaceHolder} label={userPickerPlaceHolder} />); 
        for (var i = 0; i < this.state.usersDataSource.length; i++) {
            var s = this.state.usersDataSource[i]; 
            userItems.push(<Picker.Item key={i+1} value={s.name} label={s.name} />); 
        }
        userItems.push(<Picker.Item key="other" value="Other" label="Other" />);
        
        var apiLoading;
        if(this.state.apiCallInProgress){
             apiLoading =  <Spinner color='red' />;  
        }

        var otherUserView;
        if(this.state.showOtherUserInput){
            otherUserView = <Item regular>
                            <Input placeholder='Enter Name' value={this.state.otherUser} onChangeText={(value) => this.onChageOfUser(value)} />
                            </Item>;
        }else{
            otherUserView = undefined;
        }

        return(
            <Container>
                <Content>
                <Form style={styles.row}>
                    <Picker
                        iosHeader={devicePickerPlaceHolder}
                        mode="dropdown"
                        iosIcon={<Icon name="ios-arrow-down-outline" />}
                        placeholder={devicePickerPlaceHolder}
                        placeholderStyle={{ color: "#bfc6ea" }}
                        placeholderIconColor="#007aff"
                        style={styles.deviceStyle}
                        selectedValue={this.state.imei}
                        onValueChange={this.onDeviceSelection.bind(this)}>
                        {
                        deviceItems
                        }
                    </Picker>

                    <Text style={styles.imeiStyle}>
                            {typeof this.state.imei == "undefined"? 
                                "IMEI" : this.state.imei}
                    </Text>

                    <Picker
                        iosHeader={userPickerPlaceHolder}
                        mode="dropdown"
                        iosIcon={<Icon name="ios-arrow-down-outline" />}
                        placeholder={userPickerPlaceHolder}
                        placeholderStyle={{ color: "#bfc6ea" }}
                        placeholderIconColor="#007aff"
                        style={styles.userStyle}
                        selectedValue={this.state.takenBy}
                        onValueChange={this.onUserSelection.bind(this)}>
                        {
                            userItems
                        }
                    </Picker>
                    {otherUserView}
                    <Textarea style={styles.reasonStyle} rowSpan={5} bordered placeholder="Reason" value={this.state.reason}
                        onChangeText={(value) => this.onChageOfReason(value)}/>

                    <View style={styles.addButtonView}>
                    <Button success 
                            onPress={this.onAddPress.bind(this)}>
                            <Text>REQUEST DEVICE</Text>
                    </Button>
                    </View>
                    
                    </Form>
                    {apiLoading}
                </Content>
                
        </Container>
        );
    }
}

const styles = StyleSheet.create({
    main:{
        backgroundColor: '#000000'
    },
    row: {
        backgroundColor: '#ffffff',
        flexDirection: 'column',
        margin: 16,
        padding: 16,
    },
    deviceStyle: {
        flex: 1,
    },
    imeiStyle: {
        flex: 2,
        marginTop: 16,
        color: '#9E9E9E',
        marginLeft: ( Platform.OS === 'ios' ) ? 16 : 8,
    },
    userStyle: {
        flex: 3,
        marginTop: 16
    },
    reasonStyle: {
        flex: 4,
        marginTop: 16,
        borderColor: '#78909C'
    },
    addButtonView: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        marginTop: 16
    },
    othserUser:{
        marginTop: 16
    }

});