/**
 * @module DocumentLibrary
 */

/**
 * One-line view extension of the DocumentListViewRenderer component.
 * 
 * @namespace Alfresco
 * @class Alfresco.DocumentListOnelineViewRenderer
 * @extends Alfresco.DocumentListViewRenderer
 */
(function() {

	/**
	 * YUI Library aliases
	 */
	var Dom = YAHOO.util.Dom,
	    Event = YAHOO.util.Event,
	    DDM = YAHOO.util.DragDropMgr;
	var $html = Alfresco.util.encodeHTML,
	    $links = Alfresco.util.activateLinks,
	    $combine = Alfresco.util.combinePaths,
	    $userProfile = Alfresco.util.userProfileLink,
	    $siteURL = Alfresco.util.siteURL,
	    $date = function $date(date, format) { return Alfresco.util.formatDate(Alfresco.util.fromISO8601(date), format); },
	    $relTime = Alfresco.util.relativeTime,
	    $isValueSet = Alfresco.util.isValueSet;

	/**
	 * One-line view renderer constructor.
	 * 
	 * @param name {String} the name of the OnelineViewRenderer
	 * @return {Alfresco.DocumentListOnelineViewRenderer} the instance
	 * @constructor
	 */
	Alfresco.DocumentListOnelineViewRenderer = function(name) {
		Alfresco.DocumentListOnelineViewRenderer.superclass.constructor.call(
				this, name);
		this.thumbnailColumnWidth = 0;
		this.actionsSplitAtModifier = 0;
		return this;
	};

	/**
	 * Extend from Alfresco.DocumentListViewRenderer
	 */
	YAHOO.extend(Alfresco.DocumentListOnelineViewRenderer,
			Alfresco.DocumentListViewRenderer);

	/**
	 * Do not render the thumbnail cell
	 *
	 * @method renderCellThumbnail
	 * @param scope {object} The DocumentList object
	 * @param elCell {object}
	 * @param oRecord {object}
	 * @param oColumn {object}
	 * @param oData {object|string}
	 */
	Alfresco.DocumentListOnelineViewRenderer.prototype.renderCellThumbnail = function _renderNoCellThumbnail(
			scope, elCell, oRecord, oColumn, oData, imgIdSuffix) {
		oColumn.width = this.thumbnailColumnWidth;
		Dom.setStyle(elCell, "width", oColumn.width + "px");
		Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
		elCell.innerHTML = '<span class="no-thumbnail"></span>';
	}

	/**
	 * Description/detail custom datacell formatter
	 *
	 * @method renderCellDescription
	 * @param scope {object} The DocumentList object
	 * @param elCell {object}
	 * @param oRecord {object}
	 * @param oColumn {object}
	 * @param oData {object|string}
	 */
	Alfresco.DocumentListOnelineViewRenderer.prototype.renderCellDescription = function _renderOnelineCellDescription(
			scope, elCell, oRecord, oColumn, oData) {
		var desc = "", i, j, record = oRecord.getData(), jsNode = record.jsNode, properties = jsNode.properties, isContainer = jsNode.isContainer, isLink = jsNode.isLink, title = "", titleHTML = "", version = "", canComment = jsNode.permissions.user.CreateChildren;

		if (jsNode.isLink) {
			// Link handling
			oRecord.setData("displayName", scope.msg("details.link-to",
					record.location.file));
		} else if (properties.title && properties.title !== record.displayName
				&& scope.options.useTitle) {
			// Use title property if it's available. Supressed for links.
			titleHTML = '<span class="title">(' + $html(properties.title)
					+ ')</span>';
		}

		// Version display
		if ($isValueSet(record.version) && !jsNode.isContainer
				&& !jsNode.isLink) {
			version = '<span class="document-version">' + $html(record.version)
					+ '</span>';
		}

		/**
		 *  Render using metadata template
		 */
		record._filenameId = Alfresco.util.generateDomId();

		var metadataTemplate = record.metadataTemplate;
		if (metadataTemplate) {
			/* Banner */
			if (YAHOO.lang.isArray(metadataTemplate.banners)) {
				var fnRenderBanner = function fnRenderBanner_substitute(p_key,
						p_value, p_meta) {
					var label = (p_meta !== null ? scope.msg(p_meta) + ': '
							: ''), value = "";

					// render value from properties or custom renderer
					if (scope.renderers.hasOwnProperty(p_key)
							&& typeof scope.renderers[p_key] === "function") {
						value = scope.renderers[p_key].call(scope, record,
								label);
					} else {
						if (jsNode.hasProperty(p_key)) {
							value = '<span class="item">' + label
									+ $html(jsNode.properties[p_key])
									+ '</span>';
						}
					}

					return value;
				};
					
				var html, banner;
				for (i = 0, j = metadataTemplate.banners.length; i < j; i++) {
					banner = metadataTemplate.banners[i];
					if (!$isValueSet(banner.view)
							|| banner.view == this.metadataBannerViewName) {
						html = YAHOO.lang.substitute(banner.template,
								scope.renderers, fnRenderBanner);
						if ($isValueSet(html)) {
							desc += '<div class="no-info-banner">' + html
									+ '</div>';
						}
					}
				}
			}

			/* Title */
			if (YAHOO.lang.isString(metadataTemplate.title)) {
				var fnRenderTitle = function fnRenderTitle_substitute(p_key,
						p_value, p_meta) {
					var label = (p_meta !== null ? '<em>' + scope.msg(p_meta)
							+ '</em>: ' : ''), value = "";

					// render value from properties or custom renderer
					if (scope.renderers.hasOwnProperty(p_key)
							&& typeof scope.renderers[p_key] === "function") {
						value = scope.renderers[p_key].call(scope, record,
								label);
					} else {
						if (jsNode.hasProperty(p_key)) {
							value = '<div class="filename">'
									+ Alfresco.DocumentList
											.generateFileFolderLinkMarkup(
													scope, record);
							value += label + $html(jsNode.properties[p_key])
									+ '</a></span></div>';
						}
					}

					return value;
				};

				desc += YAHOO.lang.substitute(metadataTemplate.title,
						scope.renderers, fnRenderTitle);
			} else {
				// Insitu editing for title (filename)
				if (jsNode.hasPermission("Write") && !jsNode.isLocked
						&& !jsNode.hasAspect("cm:workingcopy")) {
					scope.insituEditors
							.push({
								context : record._filenameId,
								params : {
									type : "textBox",
									nodeRef : jsNode.nodeRef.toString(),
									name : "prop_cm_name",
									value : record.fileName,
									fnSelect : function fnSelect(elInput, value) {
										// If the file has an extension, omit it from the edit selection
										var extnPos = value
												.lastIndexOf(Alfresco.util
														.getFileExtension(value)) - 1;
										if (extnPos > 0) {
											Alfresco.util.selectText(elInput,
													0, extnPos);
										} else {
											elInput.select();
										}
									},
									validations : [
											{
												type : Alfresco.forms.validation.nodeName,
												when : "keyup",
												message : scope
														.msg("validation-hint.nodeName")
											},
											{
												type : Alfresco.forms.validation.length,
												args : {
													min : 1,
													max : 255,
													crop : true
												},
												when : "keyup",
												message : scope
														.msg(
																"validation-hint.length.min.max",
																1, 255)
											} ],
									title : scope.msg("tip.insitu-rename"),
									errorMessage : scope
											.msg("message.insitu-edit.name.failure")
								},
								callback : {
									fn : scope._insituCallback,
									scope : scope,
									obj : record
								}
							});
				}

				desc += '<h3 class="filename"><span id="'
						+ record._filenameId
						+ '">'
						+ Alfresco.DocumentList.generateFileFolderLinkMarkup(
								scope, record);
				desc += $html(record.displayName) + '</a></span>' + titleHTML
						+ version + '</h3>';
			}

			if (YAHOO.lang.isArray(metadataTemplate.lines)) {
				var fnRenderTemplate = function fnRenderTemplate_substitute(
						p_key, p_value, p_meta) {
					var label = (p_meta !== null ? '<em>' + scope.msg(p_meta)
							+ '</em>: ' : ''), value = "";

					// render value from properties or custom renderer
					if (scope.renderers.hasOwnProperty(p_key)
							&& typeof scope.renderers[p_key] === "function") {
						value = scope.renderers[p_key].call(scope, record,
								label);
					} else {
						if (jsNode.hasProperty(p_key)) {
							value = '<span class="item">' + label
									+ $html(jsNode.properties[p_key])
									+ '</span>';
						}
					}

					return value;
				};

				var html, line;
				for (i = 0, j = metadataTemplate.lines.length; i < j; i++) {
					line = metadataTemplate.lines[i];
					if (!$isValueSet(line.view)
							|| line.view == this.metadataLineViewName) {
						html = YAHOO.lang.substitute(line.template,
								scope.renderers, fnRenderTemplate);
						if ($isValueSet(html)) {
							desc += '<div class="no-detail">' + html + '</div>';
						}
					}
				}
			}
		}

		elCell.innerHTML = desc;
	};

})();