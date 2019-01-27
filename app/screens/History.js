import React, {Component} from 'react';
import {AppRegistry, View, TouchableHighlight, 
        ListView, StyleSheet} from 'react-native';
import { Container, Header, Content, 
            Button, Form, Input, 
            Label, Item, Icon, 
            Text, Textarea, Spinner,
            Toast, Picker } from 'native-base';


const devicePickerPlaceHolder = "Select Device";
const userPickerPlaceHolder = "Select User";
const filterByPickerPlaceHolder = "Filter By"
export default class History extends Component{
    constructor(props){
        super(props);
        console.log("in constr");  
        const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        this.state = {
            tracksDataSource: ds,
            firebaseApp: this.props.navigation.state.params.firebase,
            devices: (typeof this.props.navigation.state.params.devices != 'undefined'?
            this.props.navigation.state.params.devices: undefined),
            usersDataSource: [],
            isLoading: true,
            takenBy: undefined,
            deviceName: undefined,
            imei: undefined,
            filterBy: "all",
            isDeviceFilter: false,
            allTracksDataSource: undefined,
        }
    }

    componentDidMount(){
        this.getUsers();
        this.getTracks();
    }

    getUsers(){
        this.setState({
            isLoading: true
        });

        let users = []; 
        console.log("getUsers");  
        this.state.firebaseApp.database().ref('users').on(('value'), (snap) => { 
            snap.forEach((child) => {
                    users.push({
                        name: child.val().name
                    });
            });
            console.log('users',users); 
            this.setState({
                usersDataSource: users,
            }); 
        });
    }

    static navigationOptions = {
        title: 'History',  
        headerStyle: {
            backgroundColor: '#FF9800'
        },
        headerTitleStyle: {
            color: '#000000'
        }
    }

    getTracks(){
        console.log("Dashboard:: getTracks");  
        this.state.firebaseApp.database().ref('tracks').on(('value'), (snap) => {
            let tracks = [];
            snap.forEach((child) => {              
                tracks.push({
                        deviceName: child.val().deviceName,
                        imei: child.val().imei,
                        takenBy: child.val().takenBy,
                        reason: child.val().reason,
                        isReturned: child.val().isReturned,
                        returnDate: child.val().returnDate,
                        takenDate: child.val().takenDate
                    });
            });

            console.log(tracks); 
            this.setState({
                tracksDataSource: this.state.tracksDataSource.cloneWithRows(tracks),
                isLoading: false,
                allTracksDataSource: tracks
            });
        });
    }

    renderRow(device, sectionId, rowId, hightlightRow){
        var takenDateView, returnDateView;
        if (typeof device.takenDate != 'undefined'){
            takenDateView = <View style={styles.valuesRow}> 
                        <Text style={styles.labelColumn}>
                            Taken Date
                        </Text>
                        <Text style={styles.valueColumn}>
                            {device.takenDate}
                        </Text>
                    </View>;
        }
        if (typeof device.returnDate != 'undefined'){
            returnDateView = <View style={styles.valuesRow}> 
            <Text style={styles.labelColumn}>
            Returned Date
            </Text>
            <Text style={styles.valueColumn}>
                {device.returnDate}
            </Text>
        </View>;
        }

        return(
            <View style={styles.card}>
                <Text style={styles.rowDeviceName}>{device.deviceName}</Text>
                <View style={styles.valuesRow}> 
                        <Text style={styles.labelColumn}>
                            IMEI
                        </Text>
                        <Text style={styles.valueColumn}>
                            {device.imei}
                        </Text>
                </View>
                <View style={styles.valuesRow}> 
                        <Text style={styles.labelColumn}>
                            Taken By
                        </Text>
                        <Text style={styles.valueColumn}>
                            {device.takenBy}
                        </Text>
                </View>
                {takenDateView}
                {returnDateView}
                <View style={styles.valuesRow}> 
                        <Text style={styles.labelColumn}>
                            Reason
                        </Text>
                        <Text style={styles.valueColumn}>
                            {device.reason}
                        </Text>
                </View>
                <View style={styles.rowStatus}>                  
                    {device.isReturned? 
                    <Button bordered small success disabled='true' style={{width: 120, justifyContent: 'center'}}>
                        <Text>Returned</Text>
                    </Button>:
                    <Button bordered small danger disabled='true' style={{width: 120, justifyContent: 'center'}}>
                        <Text>Taken</Text>
                    </Button>}
                </View>
            </View>
      
        )
    }  

    onDeviceSelection(value: string) {
        if(value != devicePickerPlaceHolder){
            this.setState({
                imei: value, 
                deviceName: value
            });
            this.filterTracks(value);  
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
            this.filterTracks(value); 
        }else{
            this.setState({
                takenBy: userPickerPlaceHolder
            }); 
        }
    }

    onFilterSelection(value: string){
        var isDevice= (value == "device");
        if(value != "all"){
            this.setState({
                filterBy: value
            });
        }else{
            this.setState({
                filterBy: value,
                imei: undefined,
                takenBy: undefined,
                tracksDataSource: this.state.tracksDataSource.cloneWithRows(this.state.allTracksDataSource)
            }); 
        }
        console.log("Is device filter selected",isDevice);
        if(isDevice){
            this.state.takenBy = undefined;
        }else{
            this.state.imei = undefined;
        }
        this.setState({
            isDeviceFilter: isDevice
        });

    }

    filterTracks(value) {
        console.log("Main filter: ", this.state.filterBy)
       console.log("Sub filters: by device",this.state.imei);
       console.log("Sub filters: by user",this.state.takenBy);

        var tracks = [];
        for(var i=0; i< this.state.allTracksDataSource.length; i++){
                var track = this.state.allTracksDataSource[i];
                console.log("device",track.deviceName,"IMEI",track.imei);
                if(this.state.filterBy == "device"){
                    if(track.imei == value){
                        tracks.push(track);
                    }
                }else if(this.state.filterBy == "user"){
                    if(track.takenBy == value){
                        tracks.push(track);
                    }
                }
        }
        console.log("filtered: ",tracks);
        this.setState({
                tracksDataSource: this.state.tracksDataSource.cloneWithRows(tracks)
        });
    }

    render(){
        console.log('AddTrack:: render');
        
        var dataView;
        if(typeof this.state.tracksDataSource == 'undefined' || 
            this.state.tracksDataSource.getRowCount() == 0){
                dataView = <View style={styles.noDataView}>
                                <Text style={styles.noDataText}>History is not available.</Text>
                            </View>;
        }else{
            dataView =  <ListView 
            dataSource={this.state.tracksDataSource}
            renderRow={this.renderRow.bind(this)}/>
        }

        var currentView = this.state.isLoading? <Spinner color='red' /> : 
                            dataView;

        //to bind device data
        const deviceItems = []; 
        deviceItems.push(<Picker.Item key={0} value={devicePickerPlaceHolder} label={devicePickerPlaceHolder}/>); 
        for (var i = 0; i < this.state.devices.length; i++) {
            var s = this.state.devices[i]; 
            deviceItems.push(<Picker.Item key={i+1} value={s.imei} label={s.deviceName} />); 
        }

         //to bind user data
         const userItems = []; 
         userItems.push(<Picker.Item key={0} value={userPickerPlaceHolder} label={userPickerPlaceHolder} />); 
         for (var i = 0; i < this.state.usersDataSource.length; i++) {
             var s = this.state.usersDataSource[i]; 
             userItems.push(<Picker.Item key={i+1} value={s.name} label={s.name} />); 
         }

        var subFilter = <View></View>
        console.log("Device Filter",this.state.isDeviceFilter);
        if(typeof this.state.filterBy != 'undefined' && this.state.filterBy != "all"){
            if(this.state.isDeviceFilter){
                subFilter = <Picker
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
                </Picker>;
            }else{
                subFilter= <Picker
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
                </Picker>;
            }
        }

    
        return(
            <Content style={styles.main}> 
                <View>
                    <Picker
                        iosHeader={filterByPickerPlaceHolder}
                        mode="dropdown"
                        iosIcon={<Icon name="ios-arrow-down-outline" />}
                        placeholder={filterByPickerPlaceHolder}
                        placeholderStyle={{ color: "#bfc6ea" }}
                        placeholderIconColor="#007aff"
                        style={styles.deviceStyle}
                        selectedValue={this.state.filterBy}
                        onValueChange={this.onFilterSelection.bind(this)}>
                        <Picker.Item key="user" value="user" label="User" />
                        <Picker.Item key="device" value="device" label="Device" />
                        <Picker.Item key="all" value="all" label="Show All" />
                    </Picker>
                    {subFilter}
                </View>  
                {currentView}
            </Content>
        );
    }
}

const styles = StyleSheet.create({
    main: {
        backgroundColor: '#EEEEEE'
    },
    card: {
        backgroundColor: '#ffffff',
        flexDirection: 'column',
        marginRight: 14,
        marginLeft: 14,
        marginTop:6,
        marginBottom:6,
        padding:14
    },
    rowStatus: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        marginTop: 10,
    },
    rowDeviceName: {
        flex: 1,
        color: '#000000',
        fontSize: 18,
        fontWeight: 'bold'
    },
    labelColumn: {
        flex:1,
        color: '#9E9E9E'
    },
    valueColumn: {
        flex:2,
        color: '#9E9E9E'
    },
    valuesRow: {
        marginTop: 10,
        flexDirection: 'row'
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

