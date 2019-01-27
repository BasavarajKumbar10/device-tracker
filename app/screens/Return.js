import React, {Component} from 'react';
import {AppRegistry, View, StyleSheet} from 'react-native';
import { 
    Container, Content, Button, 
    Text, Form, Spinner } from 'native-base';

export default class Return extends Component{
    constructor(props){
        super(props);
        console.log("is from dashboard",typeof this.props.navigation.state.params.device != 'undefined');
        this.state = {
            isLoading: true,
            firebaseApp: this.props.navigation.state.params.firebase,
            device: (typeof this.props.navigation.state.params.device != 'undefined'?
                this.props.navigation.state.params.device: undefined),
            track: undefined,
            takenDate: undefined,
            reason: undefined,
            takenBy: undefined,
            apiCallInProgress: false
        }
    }

    static navigationOptions = {
        title: 'Return Device',
        headerStyle: {
            backgroundColor: '#FF9800'
        },
        headerTitleStyle: {
            color: '#000000'
        }
    }

    componentDidMount(){
        this.getTrackDetails();
    }

    getCurrentDate=() =>{
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

        date= dd + "/"+ mm +"/"+ today.getFullYear();

        console.log("Date formatted: ",date);
        return date;
    }

    getTrackDetails(){
        console.log("Retreiving track details wrt", this.state.device);
        var trackDetails = undefined;
        this.state.firebaseApp.database().ref('tracks/' +this.state.device.trackKey).once(('value'), (snap) => { 
            trackDetails = snap.val();
            console.log('Track details: ',trackDetails); 
            this.setState({
                isLoading: false,
                track: trackDetails,
                takenDate: trackDetails.takenDate,
                reason: trackDetails.reason,
                takenBy: trackDetails.takenBy
            });
        });

        
    }

    updateTrackRetunrFlag(){
        this.state.track.isReturned = true;
        //add return date
        this.state.track.returnDate = this.getCurrentDate();
        this.state.firebaseApp.database().ref('tracks/'+this.state.device.trackKey).set(this.state.track).then(() => {
            this.onFinishOfApi();
            console.log("Updated track isReturned flag to true");
            console.log("SUCCESS!");
            this.props.navigation.state.params.callReload();
            this.props.navigation.goBack();
        }).catch((error) => {
            console.log(error);
            this.onFinishOfApi();
        });
    }

    onFinishOfApi(){
        this.setState({
            apiCallInProgress: false
        })
    }

    onSubmitPress(){
        this.setState({
            apiCallInProgress: true
        })
        //update isAvailable flag to 'true' 
        this.state.device.isAvailable = true;
        this.state.firebaseApp.database().ref('devices/'+this.state.device.key).set({
            "deviceName": this.state.device.deviceName,
            "imei": this.state.device.imei,
            "isAvailable": true,
            "trackKey": this.state.device.trackKey
        }).then(() => {
            console.log("Updated devive's isAvailable flag to true");
            //update track's return flag to 'true'
            this.updateTrackRetunrFlag();
        }).catch((error) => {
            console.log(error);
            this.onFinishOfApi();
        });
    }

    render(){
        console.log('Return:: render');
        console.log('Selected device: ',this.state.device.deviceName);

        if(this.state.isLoading){
            return(
                <Container>
                    <Content padder>
                        <Spinner color='red'/>
                    </Content>
                </Container>
            )
        }

        var apiLoading;
        if(this.state.apiCallInProgress){
             apiLoading = <Spinner color='red'/>;
        }
      return(
        <Container>
            <Content>
                <Form style={styles.row}>
                    <Text style={styles.rowDeviceName}>
                        {this.state.device.deviceName}
                    </Text>
                    <View style={styles.valuesRow}> 
                        <Text style={styles.labelColumn}>
                            IMEI
                        </Text>
                        <Text style={styles.valueColumn}>
                            {this.state.device.imei}
                        </Text>
                    </View>
                    <View style={styles.valuesRow}> 
                        <Text style={styles.labelColumn}>
                            Taken By
                        </Text>
                        <Text style={styles.valueColumn}>
                            {this.state.takenBy}
                        </Text>
                    </View>
                    <View style={styles.valuesRow}> 
                        <Text style={styles.labelColumn}>
                            Taken Date
                        </Text>
                        <Text style={styles.valueColumn}>
                            {this.state.takenDate}
                        </Text>
                    </View>
                    <View style={styles.valuesRow}> 
                        <Text style={styles.labelColumn}>
                            Reason
                        </Text>
                        <Text style={styles.valueColumn}>
                            {this.state.reason}
                        </Text>
                    </View>
                    <View style={styles.submitButtonView}> 
                    <Button success 
                            onPress={this.onSubmitPress.bind(this)}>
                            <Text> RETURN </Text>
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
    rowDeviceName: {
        color: '#000000',
        fontSize: 18,
        fontWeight: 'bold'
    },
    valuesRow: {
        marginTop: 10,
        flexDirection: 'row'
    },
    labelColumn: {
        flex:1,
        color: '#9E9E9E'
    },
    valueColumn: {
        flex:2,
        color: '#9E9E9E'
    },
    submitButtonView: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        marginTop: 16
    }
});