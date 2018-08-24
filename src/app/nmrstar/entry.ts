import {Saveframe, saveframeFromJSON} from './saveframe';
import {Schema} from './schema';
import {DataFileStore} from './dataStore';
import {LoopTag} from './tag';


export class Entry {
  entry_id: string;
  saveframes: Saveframe[];
  schema: Schema;
  categories: string[][];
  enumeration_ties: {};
  source: string;
  dataStore: DataFileStore;

  constructor(data_name: string) {
    this.entry_id = data_name;
    this.saveframes = [];
    this.enumeration_ties = {};

    this.updateCategories();
  }

  toJSON(): {} {
    return {entry_id: this.entry_id, saveframes: this.saveframes, data_files: this.dataStore};
  }

  /* Return the position of a given saveframe in the saveframe list. */
  sfIndex(saveframe: Saveframe): number {
    return this.saveframes.indexOf(saveframe);
  }

  /* Add a new saveframe to the saveframe list.
     Optionally specify position if not at end. */
  addSaveframe(saveframe: Saveframe, position: number = -1): void {
    if (position < 0) {
      this.saveframes.push(saveframe);
    } else {
      this.saveframes.splice(position, 0, saveframe);
    }

    this.updateCategories();
  }

  removeSaveframe(saveframe: Saveframe): void {
    const index = this.saveframes.indexOf(saveframe, 0);
    if (index > -1) {
       this.saveframes.splice(index, 1);
    }

    this.updateCategories();
  }

  updateCategories(): void {

    this.categories = [];
    const seen = [];

    for (const sf of this.saveframes) {
      const pretty_name = sf.schema_values['category_group_view_name'];
      if (seen.indexOf(sf.category) < 0 && ['Y', 'N'].indexOf(sf.display) >= 0) {
        this.categories.push([pretty_name, sf.category]);
        seen.push(sf.category);
      }
    }
  }

  print(): string {
    let result = 'data_' + this.entry_id + '\n\n';

    for (const sf of this.saveframes) {
      result += sf.print() + '\n';
    }

    return result;
  }

  getTagValue(fqtn: string, skip: Saveframe = null): string {

    for (const sf of this.saveframes) {
      // Skip checking the saveframe that called us, if one did
      if (sf === skip) { continue; }

      // Ask the saveframe for the tag, return it if found
      const sf_res = sf.getTagValue(fqtn);
      if (sf_res) { return sf_res; }
    }

    return null;
  }

  getSaveframeByName(sf_name: string): Saveframe {
    for (const sf of this.saveframes) {
      if (sf.name === sf_name) {
        return sf;
      }
    }
    throw new Error('No saveframe with the name ' + sf_name + ' found.');
  }

  getSaveframesByCategory(sf_category: string): Saveframe[] {
    const return_list: Saveframe[] = [];
    for (const sf of this.saveframes) {
      if (sf.category.toLowerCase() === sf_category.toLowerCase()) {
        return_list.push(sf);
      }
    }
    return return_list;
  }

  getSaveframesByPrefix(tag_prefix: string): Saveframe[] {
    const return_list: Saveframe[] = [];
    for (const sf of this.saveframes) {
      if (sf.tag_prefix === tag_prefix) {
        return_list.push(sf);
      }
    }
    return return_list;
  }

  refresh(overrides: {}[] = null, category: string = null): void {

    this.enumeration_ties = {};
    for (let i = 0; i < 30; i++) {
      this.enumeration_ties[i] = new Set();
    }

    for (const sf of this.saveframes) {
      sf.refresh(overrides, category);
    }
    this.updateCategories();
  }


  /* Update the data files loop */
  updateUploadedData() {
    const dfLoop = this.getSaveframesByCategory('deposited_data_files')[0].loops[0];
    const newData = [];
    for (let i = 0; i < this.dataStore.dataFiles.length; i++) {
      for (let n = 0; n < this.dataStore.dataFiles[i].control.value.length; n++) {
        newData.push([
          new LoopTag('Data_file_ID', String(newData.length + 1), dfLoop),
          new LoopTag('Data_file_name', this.dataStore.dataFiles[i].fileName, dfLoop),
          new LoopTag('Data_file_content_type', this.dataStore.dataFiles[i].control.value[n][0], dfLoop),
          new LoopTag('Data_file_Sf_category', this.dataStore.dataFiles[i].control.value[n][1], dfLoop),
          new LoopTag('Data_file_syntax', null, dfLoop),
          new LoopTag('Data_file_immutable_flag', null, dfLoop),
          new LoopTag('Sf_ID', null, dfLoop),
          new LoopTag('Entry_ID', this.entry_id, dfLoop),
          new LoopTag('Deposited_data_files_ID', String(i + 1), dfLoop)
        ]);
      }
    }
    if (newData.length) {
      dfLoop.data = newData;
    }
  }

}

export function entryFromJSON(jdata: Object): Entry {

    const entry = new Entry(jdata['entry_id']);
    entry.schema = new Schema(jdata['schema']);
    entry.dataStore = new DataFileStore(jdata['data_files'], entry.schema.file_upload_types);

    console.log('Using schema: ' + entry.schema.version);

    for (let i = 0; i < jdata['saveframes'].length; i++) {
      const new_frame = saveframeFromJSON(jdata['saveframes'][i], entry);
      entry.addSaveframe(new_frame);
    }

  entry.refresh();
  return entry;
}
