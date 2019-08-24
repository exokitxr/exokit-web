'use strict';

const {EventTarget} = require('./Events.js');

/* var RTCDataChannel = require('./datachannel');
var RTCDataChannelEvent = require('./datachannelevent');
var RTCIceCandidate = require('./icecandidate');
var RTCPeerConnectionIceEvent = require('./rtcpeerconnectioniceevent');
var RTCSessionDescription = require('./sessiondescription');
var RTCStatsResponse = require('./rtcstatsresponse'); */

function RTCPeerConnection() {
  get canTrickleIceCandidates() {
    // XXX
  }
  get connectionState() {
    // XXX
  }
  get currentLocalDescription() {
    // XXX
  }
  get currentRemoteDescription() {
    // XXX
  }
  get defaultIceServers() {
    // XXX
  }
  get iceConnectionState() {

  }
  get iceGatheringState() {
    
  }
  get localDescription() {

  }
  get peerIdentity() {

  }
  get pendingLocalDescription() {

  }
  get pendingRemoteDescription() {

  }
  get remoteDescription() {

  }
  get sctp() {

  }
  get signalingState() {

  }

  get onconnectionstatechange() {

  }
  set onconnectionstatechange() {
    
  }
  get ondatachannel() {

  }
  set ondatachannel() {
    
  }
  get onicecandidate() {

  }
  set onicecandidate() {
    
  }
  get onicecandidateerror() {

  }
  set onicecandidateerror() {
    
  }
  get oniceconnectionstatechange() {

  }
  set oniceconnectionstatechange() {
    
  }
  get onicegatheringstatechange() {

  }
  set onicegatheringstatechange() {
    
  }
  get onisolationchange() {

  }
  set onisolationchange() {
    
  }
  get onnegotiationneeded() {

  }
  set onnegotiationneeded() {
    
  }
  get onsignalingstatechange() {

  }
  set onsignalingstatechange() {
    
  }
  get onstatsended() {

  }
  set onstatsended() {
    
  }
  get ontrack() {

  }
  set ontrack() {

  }

  addIceCandidate() {

  }
  addTrack() {
    
  }
  close() {
    
  }
  createAnswer() {
    
  }
  createDataChannel() {
    
  }
  createOffer() {
    
  }
  generateCertificate() {
    
  }
  getConfiguration() {
    
  }
  getIdentityAssertion() {
    
  }
  getLocalStreams() {
    
  }
  getReceivers() {
    
  }
  getRemoteStreams() {
    
  }
  getSenders() {
    
  }
  getStats() {
    
  }
  getStreamById() {
    
  }
  getTransceivers() {
    
  }
  removeTrack() {
    
  }
  restartIce() {
    
  }
  setConfiguration() {
    
  }
  setConfiguration() {
    
  }
  setLocalDescription() {
    
  }
  setRemoteDescription() {
    
  }
}

RTCPeerConnection.prototype.RTCIceConnectionStates = [
  'new',
  'checking',
  'connected',
  'completed',
  'failed',
  'disconnected',
  'closed'
];

RTCPeerConnection.prototype.RTCIceGatheringStates = [
  'new',
  'gathering',
  'complete'
];

RTCPeerConnection.prototype.RTCSignalingStates = [
  'stable',
  'have-local-offer',
  'have-local-pranswer',
  'have-remote-offer',
  'have-remote-pranswer',
  'closed'
];


module.exports = RTCPeerConnection;
