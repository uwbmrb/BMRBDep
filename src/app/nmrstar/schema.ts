interface TagDataMap {
    [tag: string]: {};
}

export class Schema {
  version: string;
  headers: string[];
  schema: TagDataMap;
  tag_order: string[];
  category_order: string[];

  data_types = {};

  constructor (version: string, headers: string[], tags: string[][], data_types: {}) {
    this.version = version;
    this.headers = headers;
    this.data_types = data_types;
    this.category_order = [];
    this.tag_order = [];
    this.schema = {};

    const tag_col = this.headers.indexOf('Tag');
    const cat_col = this.headers.indexOf('SFCategory');

    for (const schem_tag of tags) {
      // Set the category order and tag order
      this.tag_order.push(schem_tag[tag_col]);
      if (this.category_order.indexOf(schem_tag[cat_col]) < 0) {
        this.category_order.push(schem_tag[cat_col]);
      }

      const tt = {};
      for (let i = 0; i <= this.headers.length; i++) {
        tt[this.headers[i]] = schem_tag[i];
      }
      this.schema[schem_tag[tag_col]] = tt;
    }
  }

  getTag(tag_name: string) {
    return this.schema[tag_name];
  }

  getValue(tag_name: string, tag_property: string) {
    const tag = this.getTag(tag_name);
    if (tag) {
      return tag[tag_property];
    } else {
      return null;
    }
  }

  checkDatatype(tag_name: string, tag_value: string) {
    const tag_datatype = this.getValue(tag_name, 'BMRB data type');
    const regexp = new RegExp(this.data_types[tag_datatype]);
    //console.log(tag_name, tag_datatype, regexp.test(tag_value), this.data_types[tag_datatype]);
    return !regexp.test(tag_value);
  }
}
