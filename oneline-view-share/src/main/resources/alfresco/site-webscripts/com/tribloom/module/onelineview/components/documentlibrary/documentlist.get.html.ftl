<@markup id="onelineDocLibView" target="documentListContainer" action="after">
<script>
	//<![CDATA[
		YAHOO.Bubbling.subscribe("postSetupViewRenderers", function(layer, args) {
			var scope = args[1].scope;
			var onelineViewRenderer = new Alfresco.DocumentListOnelineViewRenderer("oneline");
			scope.registerViewRenderer(onelineViewRenderer);
		});
	//]]>
</script>
</@>