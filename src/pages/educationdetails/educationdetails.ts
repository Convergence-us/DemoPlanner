// Components, functions, plugins
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, NgModule } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, AlertController, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { Database } from './../../providers/database/database';
import { Localstorage } from './../../providers/localstorage/localstorage';
import { LeafletDirective } from '@asymmetrik/ngx-leaflet/dist';
import * as L from "leaflet";

// Pages
import { LoginPage } from '../login/login';
import { MyAgenda } from '../myagenda/myagenda';
import { ReviewPage } from '../review/review';

declare var formatTime: any;
declare var dateFormat: any;

@IonicPage()
@Component({
  selector: 'page-educationdetails',
  templateUrl: 'educationdetails.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class EducationDetailsPage {

	// Exhibitor Details
	public EventID: string;
	public EventName: string;
	public EventSubName: string;
	public DisplayEventTimeDateLocation: string;
	public SpeakerDisplayName: string;
	public EventTypeName: string;
	public SpeakerHostEmcee: string;
	public EventCorporateSupporter: string;
	public EventDetails: string;
	public sessionAbstract: string;
	public HandoutFn: string;	
	public HandoutURL: string;
	
	// Control Buttons
	public visAgendaAddRemoveButton: string;
	public btnAgendaManagement = true;
	public AgendaButtonColor: string = '#ffffff';
	public AgendaButtonTextColor: string = '#004c94';

	public btnNotes = true;
	public btnPrint = true;
	public btnEval = false;

	public visBookmarkAddRemoveButton: string;
	public btnBookmarkManagement = true;
	public BookmarkButtonColor: string = '#ffffff';
	public BookmarkButtonTextColor: string = '#004c94';

	// Session rating
	public SessionRatingSelection: string;
	
	// SubSection Control
	public SpeakerHostShow = true;
	public CorporateSupporterShow = true;
	public AuthorsDisplay = false;
	public AbstractDisplay = true;
	public DescriptionDisplay = true;
	public SubEventsDisplay = false;
	public RecordingShow = true;
	public HandoutShow = true;
	public OtherInformationDisplay = true;

	public SpeakerList: any[] = [];

	// Other Information
	public vSessionPrimaryAudience: string;
	public vSessionAgeLevel: string;
	public SessionStatusStyle: string;
	public SessionStatus: string;
	public vSessionCourseID: string;
	public vSessionFloorRoom: string;
	public vSessionCapacity: string;
	public vSessionSetup: string;
	
	// Leaflet mapping variables
	myMap: any;

	constructor(public navCtrl: NavController, 
				public navParams: NavParams,
				private storage: Storage,
				private databaseprovider: Database,
				private cd: ChangeDetectorRef,
				private alertCtrl: AlertController, 
				public events: Events,
				public loadingCtrl: LoadingController,
				private localstorage: Localstorage) {
	}

	ionViewDidLoad() {
		console.log('ionViewDidLoad EducationDetailsPage');
	}

	goToReviewPage() {
		// Otherwise just go to the page they want
		this.navCtrl.push(ReviewPage);
	}

	mcqAnswer(value){
	   console.log(value);
	}

	SessionRatingChange(event) {

		console.log("Rating value: " + this.SessionRatingSelection);
		
		var StarRating;
		if (this.SessionRatingSelection == null) {
			StarRating = 0;
		} else {
			StarRating = this.SessionRatingSelection;
		}
		
		var AttendeeID = this.localstorage.getLocalValue('AttendeeID');
		var EventID = this.localstorage.getLocalValue('EventID');
		var flags = "rw|" + EventID + "|" + StarRating;
		console.log('AttendeeID: ' + AttendeeID);
		
		if ((AttendeeID == null) || (AttendeeID === null) || (AttendeeID.length == 0)) {
			
			this.SessionRatingSelection = null;
			this.cd.markForCheck();
			
			let alert = this.alertCtrl.create({
				title: 'Session Ratings',
				subTitle: 'You must be logged in to select a rating.',
				buttons: ['OK']
			});
			
			alert.present();
			
		} else {
			
			this.databaseprovider.getDatabaseStats(flags, AttendeeID).then(data => {
				// Nothing to do with the return data
			}).catch(function () {
				console.log("getDatabaseStats Promise Rejected");
			});
			
		}
	}
		
	ngOnInit() {

		var AttendeeID = this.localstorage.getLocalValue('AttendeeID');
		
		if (AttendeeID == '' || AttendeeID == null) {
			AttendeeID = '0';
		}

		// Load initial data set here
		//let loading = this.loadingCtrl.create({
		//	spinner: 'crescent',
		//	content: 'Please wait...'
		//});

		//loading.present();

		// Blank and show loading info
		this.cd.markForCheck();
		
		// Temporary use variables
		var flags = "dt|0|Alpha|" + this.navParams.get('EventID');
		this.EventID = this.navParams.get('EventID');
		this.localstorage.setLocalValue('EventID', this.navParams.get('EventID'));
		
        // ---------------------
        // Get Education Details
        // ---------------------

        var PrimarySpeakerName = "";
        var SQLDate;
        var DisplayDateTime;
        var dbEventDateTime;
        var courseID = "";
        var UpdatedEventDescription;
        var UpdatedEventDescription2;
		var HandoutPDFName = "";

		console.log('Education Details, flags: ' + flags);
		
        // Get course detail record
		this.databaseprovider.getLectureData(flags, AttendeeID).then(data => {
			
			console.log("getLectureData: " + JSON.stringify(data));
			
			if (data['length']>0) {

                PrimarySpeakerName = "";
                dbEventDateTime = data[0].session_start_time.substring(0, 19);
                dbEventDateTime = dbEventDateTime.replace(/-/g, '/');
                dbEventDateTime = dbEventDateTime.replace(/T/g, ' ');
                SQLDate = new Date(dbEventDateTime);
                DisplayDateTime = dateFormat(SQLDate, "mm/dd h:MMtt");

                // Display end time
                dbEventDateTime = data[0].session_end_time.substring(0, 19);
                dbEventDateTime = dbEventDateTime.replace(/-/g, '/');
                dbEventDateTime = dbEventDateTime.replace(/T/g, ' ');
                SQLDate = new Date(dbEventDateTime);
                DisplayDateTime = DisplayDateTime + " to " + dateFormat(SQLDate, "h:MMtt");

				console.log('Point 0');
				
                if (data[0].primary_speaker == "") {
                    //PrimarySpeakerName = "No Assigned Primary Presenter";
                    PrimarySpeakerName = "";
                } else {
                    PrimarySpeakerName = data[0].primary_speaker;
                }
                this.SpeakerDisplayName = PrimarySpeakerName;

 				console.log('Point 1a');
				
				this.EventName = data[0].session_title;
                this.EventSubName = "ID: " + data[0].session_id;
				
                if (data[0].RoomName === null || data[0].RoomName === undefined || data[0].RoomName.length == 0) {
                    this.DisplayEventTimeDateLocation = DisplayDateTime;
                } else {
                    this.DisplayEventTimeDateLocation = DisplayDateTime + " in " + data[0].RoomName;
                }
                //this.EventTypeName = data[0].EventTypeName;
				
 				console.log('Point 1b');
				
                if ((data[0].speaker_host_emcee === undefined) || (data[0].speaker_host_emcee === "") || (data[0].speaker_host_emcee === null)) {
                    this.SpeakerHostShow = false;
                } else {
                    this.SpeakerHostEmcee = data[0].speaker_host_emcee;
                }

                if ((data[0].corporate_supporter === undefined) || (data[0].corporate_supporter === "") || (data[0].corporate_supporter === null)) {
                    this.CorporateSupporterShow = false;
                } else {
                    this.EventCorporateSupporter = data[0].corporate_supporter;
                }

				console.log('Point 1c');
				
                UpdatedEventDescription2 = data[0].description;
                UpdatedEventDescription2 = UpdatedEventDescription2.replace(/\\/g, '');
                this.sessionAbstract = UpdatedEventDescription2;

				console.log("Abstract: " + UpdatedEventDescription2);
				
                //this.EventID = data[0].session_id;
				HandoutPDFName = data[0].HandoutFilename + ".pdf";
                this.HandoutURL = "https://naeyc.convergence-us.com/naeyc/www/assets/Handouts/" + HandoutPDFName;
                this.HandoutFn = HandoutPDFName;
				
                courseID = data[0].course_id;

                this.localstorage.setLocalValue("PDFLink", data[0].course_id);

                // Values for Agenda Management
                this.localstorage.setLocalValue("AAOID", data[0].session_id);
                this.localstorage.setLocalValue("EventStartTime", data[0].session_start_time.substring(11,19));
                this.localstorage.setLocalValue("EventEndTime", data[0].session_end_time.substring(11,19));
                this.localstorage.setLocalValue("EventLocation", data[0].RoomName);
                this.localstorage.setLocalValue("EventName", data[0].session_title);
                this.localstorage.setLocalValue("EventDate", data[0].session_start_time.substring(0,10));

                if (data[0].OnAgenda != null) {
                    this.visAgendaAddRemoveButton = "Remove";
					this.AgendaButtonColor = '#004c94';
					this.AgendaButtonTextColor = '#ffffff';
                } else {
                    this.visAgendaAddRemoveButton = "Add";
					this.AgendaButtonColor = '#ffffff';
					this.AgendaButtonTextColor = '#004c94';
                }

                // Values for Bookmark Management
                this.localstorage.setLocalValue("BookmarkID", data[0].session_id);
                this.localstorage.setLocalValue("BookmarkType", "Sessions");

                if (data[0].Bookmarked != "0") {
                    this.visBookmarkAddRemoveButton = "Remove";
					this.BookmarkButtonColor = '#004c94';
					this.BookmarkButtonTextColor = '#ffffff';
                } else {
                    this.visBookmarkAddRemoveButton = "Bookmark";
					this.BookmarkButtonColor = '#ffffff';
					this.BookmarkButtonTextColor = '#004c94';
                }

				// Session ratings
				this.SessionRatingSelection = "4";
				
                if (data[0].ce_credits_type == "") {
                    this.AbstractDisplay = false;
                } else {
                    this.DescriptionDisplay = false;
                }
				
                if ((data[0].description === undefined) || (data[0].description === "") || (data[0].description === null)) {
                    this.AbstractDisplay = false;
                    this.DescriptionDisplay = false;
                }

                if (data[0].session_recording.trim() == "N") {
                    this.RecordingShow = false;
                }

				console.log('HandoutFilename: ' + HandoutPDFName);
                if (data[0].HandoutFilename === "" || data[0].HandoutFilename === null) {
                    this.HandoutShow = false;
                }

				// Other Information grid
				if (data[0].PrimaryAudience != '') {
					var PrimaryAudience = data[0].PrimaryAudience.replace(/; /g, '\r\n');
					this.vSessionPrimaryAudience = PrimaryAudience;
				} else {
					this.vSessionPrimaryAudience = "";
				}
				
				if (data[0].AgeLevel != '') {
					var AgeLevel = data[0].AgeLevel.replace(/; /g, '\r\n');
					this.vSessionAgeLevel = AgeLevel;
				} else {
					this.vSessionAgeLevel = "";
				}

				this.vSessionCourseID = data[0].session_id;
				this.vSessionFloorRoom = data[0].FloorNumber + " / " + data[0].RoomName;
				// Removed on 6/1/2018 by Lauren
				// Leaving code in place because it can 
				// be used by other clients like AACD
				//this.vSessionCapacity = data[0].room_capacity;
				//this.vSessionSetup = data[0].room_setup;

				// Status checks
				var SessionStatus = "";
				var StatusStyle = "SessionStatusNormal";
				
				// Room Capacity check
				if (parseInt(data[0].room_capacity) <= parseInt(data[0].Attendees)) {
					SessionStatus = "Popular Course Nearing Capacity";
					StatusStyle = "SessionStatusRed";
				}
				
				// Waitlist check
				if (data[0].Waitlist == "1") {
					if (SessionStatus == "") {
						SessionStatus = "You are Waitlisted";
						StatusStyle = "SessionStatusRed";
					} else {
						SessionStatus = SessionStatus + " / You are Waitlisted";
						StatusStyle = "SessionStatusRed";
					}
				}

				// Cancellation check
				if (data[0].CancelledYN == "Y") {
					SessionStatus = "CANCELLED";
					StatusStyle = "SessionStatusRed";
				}

				console.log(SessionStatus);
				
				this.SessionStatusStyle = StatusStyle;
				this.SessionStatus = SessionStatus;
				
				console.log('Point 2');
				
				// ---------------------------
                // Get Linked Speakers
                // ---------------------------

                this.AuthorsDisplay = false;
                if (data[0].ce_credits_type == "") {
					
                    // Keep hidden for non-CE events
					console.log('Non-CE event');
					this.OtherInformationDisplay = false;
					
					this.cd.markForCheck();

					//loading.dismiss();
					
                } else {
					console.log('Loading speakers');
					flags = "cd|Alpha|0|0|" + courseID;

                    // Get speaker detail record
					this.databaseprovider.getSpeakerData(flags, AttendeeID).then(data2 => {
						
						console.log("getSpeakerData: " + JSON.stringify(data2));

						if (data2['length'] > 0) {

							// Process returned records to display
							this.SpeakerList = [];
							var DisplayName = "";

                            for (var i = 0; i < data2['length']; i++) {

                                DisplayName = "";

                                // Concatenate fields to build displayable name
                                DisplayName = DisplayName + data2[i].FirstName;
                                //if (resA.rows.item(i).MiddleInitial != "") {
                                //    DisplayName = DisplayName + " " + data2[i].MiddleInitial;
                                //}
                                DisplayName = DisplayName + " " + data2[i].LastName;
								
                                //if (data2[i].imis_designation != "" && data2[i].imis_designation != null) {
                                //    DisplayName = DisplayName + ", " + data2[i].imis_designation;
                                //}
								//if (data2[i].Credentials != "") {
								//	DisplayName = DisplayName + " " + data2[i].Credentials;
								//}

								var imageAvatar = "";
								//if (data2[i].imageFilename === null || data2[i].imageFilename === undefined || data2[i].imageFilename.length == 0) {
								//	imageAvatar = data2[i].imageFilename;
								//	imageAvatar = imageAvatar.substr(0, imageAvatar.length - 3) + 'png';
									//console.log("imageAvatar: " + imageAvatar);
								//} else {
								//	imageAvatar = 'personIcon.png';
								//}
								//imageAvatar = "assets/img/speakers/" + imageAvatar;

								this.SpeakerList.push({
									speakerIcon: "person",
									speakerAvatar: imageAvatar,
									navigationArrow: "arrow-dropright",
                                    SpeakerID: data2[i].speakerID,
                                    DisplayNameLastFirst: DisplayName,
									DisplayCredentials: data2[i].Title
                                    //Affiliation: data2[i].Affiliation
                                });

                            }

                            this.AuthorsDisplay = true;

						}

						this.cd.markForCheck();

						//loading.dismiss();
						
					}).catch(function () {
						console.log("Speaker Promise Rejected");
					});
					
				}
				
				// --------------------
                // Session room mapping
				// --------------------
				/*
				console.log('Session room mapping');
                var y = 0;
                var x = 0;
                var RoomName = "";
				var FloorNumber = "";

                if (data[0].RoomY != null) {
                    y = data[0].RoomY;
                    x = data[0].RoomX;
                }
                RoomName = data[0].RoomName;
				FloorNumber = data[0].FloorNumber;
				
				console.log("Session room (x,y): " + x + ", " + y);
				console.log("Session floor: " + FloorNumber);
				
                if ((x === undefined) || (y === undefined)) {
                    // Show empty map
					console.log('Show empty map');
                    this.myMap = L.map('map2', {
                        crs: L.CRS.Simple,
                        minZoom: 0,
                        maxZoom: 2,
                        zoomControl: false
                    });

                    var bounds = L.latLngBounds([0, 0], [1500, 2000]);    // Normally 1000, 1000; stretched to 2000,1000 for AACD 2017
                    var image = L.imageOverlay('assets/img/SessionFloorplan.png', bounds, {
                        attribution: 'Convergence'
                    }).addTo(this.myMap);

                    this.myMap.fitBounds(bounds);
					this.myMap.setMaxBounds(bounds);

                } else {

                    // Simple coordinate system mapping
					console.log('Simple coordinate system mapping');
                    this.myMap = L.map('map2', {
                        crs: L.CRS.Simple,
                        minZoom: -2,
                        maxZoom: 0,
                        zoomControl: true
                    });

					// Determine which session floorplan to display
					switch(FloorNumber) {
						case "2":
							var bounds = L.latLngBounds([0, 0], [1500, 2000]);    // Normally 1000, 1000; stretched to 2000,1000 for AACD 2017

							var image = L.imageOverlay('assets/img/SessionFloorplanLevel2.png', bounds, {
								attribution: 'Convergence'
							}).addTo(this.myMap);
							break;
						case "3":
							var bounds = L.latLngBounds([0, 0], [1500, 2000]);    // Normally 1000, 1000; stretched to 2000,1000 for AACD 2017

							var image = L.imageOverlay('assets/img/SessionFloorplanLevel3.png', bounds, {
								attribution: 'Convergence'
							}).addTo(this.myMap);
							break;
						case "4":
							var bounds = L.latLngBounds([0, 0], [1500, 2000]);    // Normally 1000, 1000; stretched to 2000,1000 for AACD 2017

							var image = L.imageOverlay('assets/img/SessionFloorplanLevel4.png', bounds, {
								attribution: 'Convergence'
							}).addTo(this.myMap);
							break;
							
					}
					
                    this.myMap.fitBounds(bounds);
					this.myMap.setMaxBounds(bounds);

                    var SessionName = L.latLng([y, x]);

                    L.marker(SessionName).addTo(this.myMap)
                        .bindPopup(RoomName)
                        .openPopup();

                    this.myMap.setView([y, x], 1);

                }
				*/
			}
		
		}).catch(function () {
			console.log("Course Promise Rejected");
		});


        // -------------------
        // Get Attendee Status
        // -------------------
		console.log('Attendee Button Management, AttendeeID: ' + AttendeeID);
		if (AttendeeID == '0') {
			this.btnNotes = false;
			this.btnAgendaManagement = false;
			this.btnBookmarkManagement = false;
		} else {
			this.btnNotes = true;
			this.btnAgendaManagement = true;
			this.btnBookmarkManagement = true;
		}

	}

    SpeakerDetails(SpeakerID) {
		
        if (SpeakerID != 0) {
            // Navigate to Speaker Details page
			this.navCtrl.push('SpeakerDetailsPage', {SpeakerID: SpeakerID}, {animate: true, direction: 'forward'});
        }

    };

    printWindow() {
        window.open('https://www.google.com/cloudprint/#printers', '_system');
    };

    openPDF(PDFURL) {
        var ref = window.open(PDFURL, '_system');
    };

    navToMyAgenda() {

		var AttendeeID = this.localstorage.getLocalValue('AttendeeID');
		if (AttendeeID != '' && AttendeeID != null) {
			// If not, store the page they want to go to and go to the Login page
			console.log('Stored AttendeeID: ' + AttendeeID);
			this.localstorage.setLocalValue('NavigateToPage', "MyAgenda");
			this.navCtrl.push(LoginPage, {}, {animate: true, direction: 'forward'});
		} else {
			// Otherwise just go to the page they want
			this.navCtrl.push(MyAgenda, {}, {animate: true, direction: 'forward'});
		}

	};

    navToNotes(EventID) {

		console.log("NoteDetails: " + EventID);

		var AttendeeID = this.localstorage.getLocalValue('AttendeeID');
		if (AttendeeID == '' || AttendeeID == null) {
			// If not, store the page they want to go to and go to the Login page
			console.log('Stored AttendeeID: ' + AttendeeID);
			this.localstorage.setLocalValue('NavigateToPage', "NotesDetailsPage");
			this.navCtrl.push(LoginPage, {}, {animate: true, direction: 'forward'});
		} else {
			// Otherwise just go to the page they want
			this.navCtrl.push('NotesDetailsPage', {EventID: EventID}, {animate: true, direction: 'forward'});
		}

	};
	
    AgendaManagement() {
		
		console.log("Begin AgendaManagement process...");

		var AttendeeID = this.localstorage.getLocalValue('AttendeeID');

        var AAOID = this.localstorage.getLocalValue("AAOID");
        var EventID = this.localstorage.getLocalValue("EventID");
        var EventStartTime = this.localstorage.getLocalValue("EventStartTime");
        var EventEndTime = this.localstorage.getLocalValue("EventEndTime");
        var EventLocation = this.localstorage.getLocalValue("EventLocation");
        var EventName = this.localstorage.getLocalValue("EventName");
		EventName = EventName.replace(/'/g, "''");
        var EventDate = this.localstorage.getLocalValue("EventDate");

		var flags = '';
		
		// Starting variables
		console.log("AttendeeID: " + AttendeeID);
		console.log("AAOID: " + AAOID);
		console.log("EventID: " + EventID);
		console.log("EventStartTime: " + EventStartTime);
		console.log("EventEndTime: " + EventEndTime);
		console.log("EventLocation: " + EventLocation);
		console.log("EventName: " + EventName);
		console.log("EventDate: " + EventDate);

		this.cd.markForCheck();
		
		var LastUpdateDate2 = new Date().toUTCString();
		var LastUpdateDate = dateFormat(LastUpdateDate2, "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'");

        if (this.visAgendaAddRemoveButton == "Add") {

            // ------------------------
            // Add item to Agenda
            // ------------------------
			flags = 'ad|0|' + EventID + '|' + EventStartTime + '|' + EventEndTime + '|' + EventLocation + '|' + EventName + '|' + EventDate + '|' + AAOID + '|' + LastUpdateDate;
			console.log("flags: " + flags);
			
			this.databaseprovider.getAgendaData(flags, AttendeeID).then(data => {
				
				console.log("getAgendaData: " + JSON.stringify(data));

				if (data['length']>0) {

                    console.log("Return status: " + data[0].AddStatus);

					if (data[0].AddStatus == "Success") {
						
						this.events.publish('user:Status', 'AgendaItem Add');
						this.visAgendaAddRemoveButton = "Remove";
						this.AgendaButtonColor = '#004c94';
						this.AgendaButtonTextColor = '#ffffff';
						this.cd.markForCheck();
						
					} else {
						
						console.log("Return query: " + data[0].AddQuery);
						
						let alert = this.alertCtrl.create({
							title: 'Agenda Item',
							subTitle: 'Unable to add the item to your agenda at this time. Please try again shortly.',
							buttons: ['OK']
						});
						
						alert.present();
						
					}
					
				}

			}).catch(function () {
				console.log("Promise Rejected");
			});
			
        } else {

            // -----------------------
            // Remove Item from Agenda
            // -----------------------
			flags = 'dl|0|' + EventID + '|' + EventStartTime + '|' + EventEndTime + '|' + EventLocation + '|' + EventName + '|' + EventDate + '|' + AAOID + '|' + LastUpdateDate;
			console.log("flags: " + flags);
			
			this.databaseprovider.getAgendaData(flags, AttendeeID).then(data => {
				
				console.log("getAgendaData: " + JSON.stringify(data));

				if (data['length']>0) {

                    console.log("Return status: " + data[0].DeleteStatus);

					if (data[0].DeleteStatus == "Success") {
						
						this.events.publish('user:Status', 'AgendaItem Remove');
						this.visAgendaAddRemoveButton = "Add";
						this.AgendaButtonColor = '#ffffff';
						this.AgendaButtonTextColor = '#004c94';
						this.cd.markForCheck();
						
					} else {
						
						console.log("Return query: " + data[0].DeleteQuery);
						
						let alert = this.alertCtrl.create({
							title: 'Agenda Item',
							subTitle: 'Unable to remove the item from your agenda at this time. Please try again shortly.',
							buttons: ['OK']
						});
						
						alert.present();
						
					}
					
				}

			}).catch(function () {
				console.log("Promise Rejected");
			});

        }

    };

    BookmarkManagement() {
		
		console.log("Begin BookmarkManagement process...");

		var AttendeeID = this.localstorage.getLocalValue('AttendeeID');

        var BookmarkType = this.localstorage.getLocalValue("BookmarkType");
        var BookmarkID = this.localstorage.getLocalValue("BookmarkID");

		var flags = '';
		
		// Starting variables
		console.log("AttendeeID: " + AttendeeID);
		console.log("BookmarkType: " + BookmarkType);
		console.log("BookmarkID: " + BookmarkID);

		this.cd.markForCheck();

		var LastUpdateDate = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

        if (this.visBookmarkAddRemoveButton == "Bookmark") {

            // ------------------------
            // Add item to Bookmarks List
            // ------------------------
			flags = 'cb|0|' + BookmarkType + '|' + BookmarkID;
			console.log("flags: " + flags);
			
			this.databaseprovider.getBookmarksData(flags, AttendeeID).then(data => {
				
				console.log("getBookmarksData: " + JSON.stringify(data));

				if (data['length']>0) {

                    console.log("Return status: " + data[0].Status);

					if (data[0].Status == "Saved") {
						
						this.visBookmarkAddRemoveButton = "Remove";
						this.BookmarkButtonColor = '#004c94';
						this.BookmarkButtonTextColor = '#ffffff';
						this.cd.markForCheck();
						
					} else {
						
						console.log("Return query: " + data[0].Query);
						
						let alert = this.alertCtrl.create({
							title: 'Bookmarks',
							subTitle: 'Unable to add the item to your bookmark list at this time. Please try again shortly.',
							buttons: ['OK']
						});
						
						alert.present();
						
					}
					
				}

			}).catch(function () {
				console.log("Promise Rejected");
			});
			
        } else {

            // -----------------------
            // Remove Item from Bookmarks List
            // -----------------------
			flags = 'rb|0|' + BookmarkType + '|' + BookmarkID;
			console.log("flags: " + flags);
			
			this.databaseprovider.getBookmarksData(flags, AttendeeID).then(data => {
				
				console.log("getBookmarksData: " + JSON.stringify(data));

				if (data['length']>0) {

                    console.log("Return status: " + data[0].Status);

					if (data[0].Status == "Saved") {
						
						this.visBookmarkAddRemoveButton = "Bookmark";
						this.BookmarkButtonColor = '#ffffff';
						this.BookmarkButtonTextColor = '#004c94';
						this.cd.markForCheck();
						
					} else {
						
						console.log("Return query: " + data[0].Query);
						
						let alert = this.alertCtrl.create({
							title: 'Bookmarks',
							subTitle: 'Unable to remove the item from your bookmark list at this time. Please try again shortly.',
							buttons: ['OK']
						});
						
						alert.present();
						
					}
					
				}

			}).catch(function () {
				console.log("Promise Rejected");
			});

        }

    };
	
}
