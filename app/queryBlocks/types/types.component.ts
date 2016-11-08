import { Component, OnChanges, SimpleChange, Input, Output, EventEmitter } from "@angular/core";
declare var $: any;

@Component({
	selector: 'types',
	templateUrl: './app/queryBlocks/types/types.component.html',
	inputs: ['detectChange', 'setProp', 'buildQuery']
})

export class TypesComponent implements OnChanges {
	@Input() mapping: any;
	@Input() config: any;
	@Input() types: any;
	@Input() selectedTypes: any;
	@Input() result: any;
	@Input() finalUrl: string;
	@Input() urlShare: any;
	@Output() setProp = new EventEmitter < any > ();
	@Output() buildQuery = new EventEmitter < any > ();

	constructor() {}

	ngOnChanges(changes: {
		[propertyName: string]: SimpleChange
	}) {
		if (changes['detectChange'] && this.types.length) {
			var setType = $('#setType');
			if(setType.attr('class').indexOf('selec2') > -1) {
				setType.select2('destroy').html('');
			}
			setType.select2({
				placeholder: "Select types to apply query",
				tags: false,
				data: this.createTokenData(this.types)
			});
			setType.on("change", function(e) {
				this.changeType(setType.val());
			}.bind(this));
		}
	}

	createTokenData(types) {
		var data = [];
		types.forEach(function(val) {
			var obj = {
				id: val,
				text: val
			};
			data.push(obj);
		});
		return data;
	}

	changeType(val) {
		//this.mapping.resultQuery.result = [];
		var availableFields: any = [];
		var propInfo: any;
		var allMappings = this.mapping[this.config.appname].mappings;
		this.result.joiningQuery = [''];

		if (val && val.length) {
			val.forEach(function(type: any) {
				let mapObjWithFields = {};
				var mapObj = allMappings[type].properties;
				for (let field in mapObj) {
					mapObjWithFields[field] = mapObj[field];
					if(mapObj[field].fields) {
						for (let sub in mapObj[field].fields) {
							let subname = field+'.'+sub;
							mapObjWithFields[subname] = mapObj[field].fields[sub];
						}		
					}
					if(mapObj[field].properties) {
						for (let sub in mapObj[field].properties) {
							let subname = field+'.'+sub;
							mapObjWithFields[subname] = mapObj[field].properties[sub];
						}		
					}
					if (mapObj[field].type === 'nested') {
						if (this.result.joiningQuery.indexOf('nested') < 0) {
							this.result.joiningQuery.push('nested');
						}
					}
				}
				for (var field in mapObjWithFields) {
					var index = typeof mapObjWithFields[field]['index'] != 'undefined' ? mapObjWithFields[field]['index'] : null;
					var obj = {
						name: field,
						type: mapObjWithFields[field]['type'],
						index: index
					}
					switch (obj.type) {
						case 'long':
						case 'integer':
						case 'short':
						case 'byte':
						case 'double':
						case 'float':
							obj.type = 'numeric';
							break;
						case 'text':
						case 'keyword':
							obj.type = 'string';
							break;
					}
					availableFields.push(obj);
				}
			}.bind(this));
			this.setUrl(val);
			propInfo = {
				name: 'selectedTypes',
				value: val
			};
			this.setProp.emit(propInfo);
		} else {
			propInfo = {
				name: 'selectedTypes',
				value: []
			};
			this.setProp.emit(propInfo);
			this.setUrl([]);
		}

		propInfo = {
			name: 'availableFields',
			value: availableFields
		};
		this.setProp.emit(propInfo);

		for (let type in allMappings) {
			if (allMappings[type].hasOwnProperty('_parent')) {
				if (val.indexOf(allMappings[type]['_parent'].type) > -1) {
					if (this.result.joiningQuery.indexOf('has_child') < 0) {
						this.result.joiningQuery.push('has_child');
					}
				}
			}
		}
	}

	setUrl(val: any) {
		var selectedTypes = val;
		if(!this.finalUrl) {
			console.log('Finalurl is not present');
		} else {
			var finalUrl = this.finalUrl.split('/');
			var lastUrl = '';
			finalUrl[3] = this.config.appname;
			if (finalUrl.length > 4) {
				finalUrl[4] = selectedTypes.join(',');
				finalUrl[5] = '_search';
				lastUrl = finalUrl.join('/');
			} else {
				var typeJoin = '/' + selectedTypes.join(',');
				if(!selectedTypes.length) {
					typeJoin = '';
				}
				lastUrl = this.finalUrl + typeJoin + '/_search';
			}
			var propInfo = {
				name: 'finalUrl',
				value: lastUrl
			};
			this.setProp.emit(propInfo);
		}
		setTimeout(function() {
			this.buildQuery.emit(null);
		}.bind(this), 300);
	}

}
