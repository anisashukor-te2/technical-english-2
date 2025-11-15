// This file re-exports the correct module to prevent import ambiguity
// due to a typo in the directory structure ("handlingComplaints" vs "complaints").
export { HandlingComplaintsModule } from '../complaints/HandlingComplaintsModule';
