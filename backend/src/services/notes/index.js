import NotesService from './notesService.js';
import SearchService from './searchService.js';
import SmartTagService from './smartTagService.js';

const services = {
  notes: new NotesService(),
  search: new SearchService(),
  smartTag: new SmartTagService(),
};

export function getService(name) {
  return services[name];
} 