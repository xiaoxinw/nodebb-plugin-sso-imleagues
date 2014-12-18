<h1> IMLeagues Accounts Social Authentication</h1>
<hr />

<form class="sso-imleagues">
	<div class="alert alert-warning">
		<input type="text" name="id" title="Client ID" class="form-control" placeholder="Client ID"><br />
		<input type="text" name="secret" title="Client Secret" class="form-control" placeholder="Client Secret"><br />
		<input type="text" name="apiserver" title="Api Server" class="form-control" placeholder="Api Server(Example:http://api.imlocal.com)">
		<p class="help-block">
			The appropriate "Redirect URI" is your NodeBB's URL with `/auth/imleagues/callback` appended to it.
		</p>
	</div>
</form>

<button class="btn btn-lg btn-primary" type="button" id="save">Save</button>

<script>
	require(['settings'], function(Settings) {
		Settings.load('sso-imleagues', $('.sso-imleagues'));

		$('#save').on('click', function() {
			Settings.save('sso-imleagues', $('.sso-imleagues'));
		});
	});
</script>